<?php

namespace App\Services;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Events\OrdersUpdated;
use App\Http\Requests\OrderProductStoreRequest;
use App\Http\Requests\OrderProductUpdateRequest;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Consultas y mutaciones de productos/extras dentro de una orden: buscar la orden y sus
 * líneas, decidir si admite cambios (orderDenial), agregar, actualizar, marcar listo, borrar y
 * vaciar el carrito. El controller (OrderProductController) solo orquesta: llama aquí y
 * traduce el resultado a la respuesta. Las mutaciones asumen que orderDenial ya dio null.
 */
class OrderProductService
{
    /** Valor de orderDenial cuando el usuario no puede acceder a la sucursal de la orden. */
    public const DENIED_ACCESS = 'Unauthorized';

    public function __construct(private readonly OrderProductAddonService $addonService) {}

    public function findOrder(int|string $orderId, bool $lock = false): ?OrderModel
    {
        return OrderModel::with('sistema')->when($lock, fn ($query) => $query->lockForUpdate())->find($orderId);
    }

    /** Línea de la orden por su id (o por otra columna, ej. producto_id). */
    public function findLine(int|string $orderId, int|string $value, string $column = 'id'): ?OrderProductModel
    {
        return OrderProductModel::where(OrderProductModel::PEDIDO_ID, $orderId)->where($column, $value)->first();
    }

    /** Líneas de la orden con sus relaciones; con $productId, solo las de ese producto. */
    public function lines(OrderModel $order, int|string|null $productId = null): Collection
    {
        return OrderProductModel::with(['product.addons', 'variant', 'addons'])
            ->where(OrderProductModel::PEDIDO_ID, $order->id)
            ->when($productId !== null, fn ($query) => $query->where(OrderProductModel::PRODUCTO_ID, $productId))
            ->get();
    }

    /**
     * Motivo por el que no se puede operar sobre los productos de la orden, o null si se puede:
     * la orden no existe, el usuario no accede a su sucursal (DENIED_ACCESS) o — con
     * $requireEditable — no está InProcess/Served o su caja ya cerró. Bloquea agregar/editar/
     * borrar en órdenes cerradas aunque el cliente envíe la petición (ej. UI desincronizada
     * por caché stale en red lenta).
     */
    public function orderDenial(?OrderModel $order, User $user, bool $requireEditable = true): ?string
    {
        if (! $order) {
            return 'no existe la orden';
        }

        if (! $order->isAccessibleByUser($user)) {
            return self::DENIED_ACCESS;
        }

        if (! $requireEditable) {
            return null;
        }

        $editableStatuses = [OrderStatusEnum::IN_PROCESS->value, OrderStatusEnum::SERVED->value];
        if (! in_array($order->estatus_pedido_id, $editableStatuses, true)) {
            return 'La orden ya fue cerrada y no se puede modificar';
        }

        if ($order->sistema && $order->sistema->estatus_caja !== MainOrderStatusEnum::OPEN->value) {
            return 'La caja de esta venta ya está cerrada.';
        }

        return null;
    }

    /**
     * store — el stock no se toca aquí, se descuenta recién al cerrar la orden
     * (ver OrderController::update).
     */
    public function addProduct(OrderModel $order, OrderProductStoreRequest $params): OrderProductModel
    {
        $orderDiscount = $order->descuento ?? 0;
        $itemDescuento = $params->descuento ?? 0;

        OrderModel::lockForUpdate()->find($order->id);

        // Un extra libre nunca lleva toppings (lo rechaza la request); solo líneas de catálogo.
        $addonRows = $params->nombre_extra ? [] : $this->addonService->rowsFor($params->input('addons', []));

        if ($params->nombre_extra) {
            $precio = (float) $params->precio;
            $orderProduct = OrderProductModel::create([
                OrderProductModel::PEDIDO_ID => $order->id,
                OrderProductModel::NOMBRE_EXTRA => $params->nombre_extra,
                OrderProductModel::CANTIDAD => $params->cantidad,
                OrderProductModel::PRECIO => $precio,
                OrderProductModel::DESCUENTO => $itemDescuento,
            ]);
        } else {
            $precio = $this->resolveCatalogPrice($params->producto_id, $params->variant_id ?? null);
            $orderProduct = OrderProductModel::create([
                OrderProductModel::PRODUCTO_ID => $params->producto_id,
                OrderProductModel::VARIANT_ID => $params->variant_id ?? null,
                OrderProductModel::PEDIDO_ID => $order->id,
                OrderProductModel::CANTIDAD => $params->cantidad,
                OrderProductModel::PRECIO => $precio,
                OrderProductModel::DESCUENTO => $itemDescuento,
                OrderProductModel::IS_READY => false,
            ]);
        }

        $this->addonService->attach($orderProduct, $addonRows);

        // El precio unitario de la línea incluye sus toppings: la cantidad y el descuento de la
        // línea los multiplican igual que al producto.
        $unitPrice = $precio + $this->addonService->unitTotal($addonRows);
        $deltaSubtotal = $this->lineSubtotal($unitPrice, $params->cantidad, $itemDescuento);
        $this->applyOrderDeltaIncrement($order->id, $deltaSubtotal, $orderDiscount);

        $this->resetStatusIfReady($order->fresh());
        OrdersUpdated::dispatchAfterCommit('product_updated', (int) $order->id);

        return $orderProduct->load('addons');
    }

    /**
     * addProducts — alta en lote (checkout de QuickSale): un solo lock, un solo delta al
     * total de la orden, un solo evento — en vez de que el frontend llame addProduct() una
     * vez por línea del carrito. Solo cubre productos de catálogo (nunca "extras", el
     * carrito de QuickSale no los trae) — el precio, igual que en addProduct(), siempre se
     * resuelve del catálogo/variante, nunca del valor que mande el cliente.
     *
     * @param  array<array{producto_id:int, variant_id?:?int, cantidad:float, addons?:array}>  $items
     */
    public function addProducts(OrderModel $order, array $items): Collection
    {
        $orderDiscount = $order->descuento ?? 0;

        OrderModel::lockForUpdate()->find($order->id);

        [$orderProducts, $deltaSubtotal] = $this->createLines($order, $items);

        $this->applyOrderDeltaIncrement($order->id, $deltaSubtotal, $orderDiscount);

        $this->resetStatusIfReady($order->fresh());
        OrdersUpdated::dispatchAfterCommit('product_updated', (int) $order->id);

        return $orderProducts->load('addons');
    }

    /**
     * syncProducts — deja las líneas de catálogo de la orden iguales al carrito recibido
     * (checkout de QuickSale al retomar una venta): actualiza la cantidad de las líneas que ya
     * existen (por order_product_id, solo si son de esta orden y del mismo producto/variante),
     * crea las nuevas y borra las que ya no vienen. Los extras (nombre libre) no se tocan.
     * Un solo lock, un solo delta al total y un solo evento; repetir la request deja el mismo
     * resultado. Devuelve todas las líneas de la orden con la misma forma que el index.
     *
     * @param  array<array{order_product_id?:?int, producto_id:int, variant_id?:?int, cantidad:float}>  $items
     */
    public function syncProducts(OrderModel $order, array $items): Collection
    {
        $orderDiscount = $order->descuento ?? 0;

        OrderModel::lockForUpdate()->find($order->id);

        $lines = OrderProductModel::with('addons')
            ->where(OrderProductModel::PEDIDO_ID, $order->id)
            ->whereNotNull(OrderProductModel::PRODUCTO_ID)
            ->get()
            ->keyBy('id');

        $deltaSubtotal = 0.0;
        $keptIds = [];
        $newItems = [];

        foreach ($items as $item) {
            $line = $lines->get((int) ($item['order_product_id'] ?? 0));

            if (! $line || isset($keptIds[$line->id])
                || (int) $line->producto_id !== (int) $item['producto_id']
                || (int) $line->variant_id !== (int) ($item['variant_id'] ?? 0)) {
                $newItems[] = $item;

                continue;
            }

            $keptIds[$line->id] = true;
            $oldSubtotal = $this->lineSubtotal($line->unitPriceWithAddons(), $line->cantidad, $line->descuento);
            $line->update([OrderProductModel::CANTIDAD => $item['cantidad']]);
            $deltaSubtotal += $this->lineSubtotal($line->unitPriceWithAddons(), $line->cantidad, $line->descuento) - $oldSubtotal;
        }

        foreach ($lines as $line) {
            if (! isset($keptIds[$line->id])) {
                $deltaSubtotal -= $this->lineSubtotal($line->unitPriceWithAddons(), $line->cantidad, $line->descuento);
                $line->delete();
            }
        }

        [, $createdSubtotal] = $this->createLines($order, $newItems);

        $this->applyOrderDeltaIncrement($order->id, round($deltaSubtotal + $createdSubtotal, 2), $orderDiscount);

        $this->resetStatusIfReady($order->fresh());
        OrdersUpdated::dispatchAfterCommit('product_updated', (int) $order->id);

        return $this->lines($order);
    }

    /**
     * Crea las líneas de catálogo de $items y devuelve [líneas creadas, subtotal que suman].
     * El precio siempre se resuelve del catálogo/variante, nunca del valor que mande el cliente.
     * No toca el total de la orden ni emite eventos: lo hace quien la llama.
     *
     * @param  array<array{producto_id:int, variant_id?:?int, cantidad:float, addons?:array}>  $items
     * @return array{0: Collection, 1: float}
     */
    private function createLines(OrderModel $order, array $items): array
    {
        $productIds = collect($items)->pluck('producto_id')->filter()->unique();
        $variantIds = collect($items)->pluck('variant_id')->filter()->unique();
        $products = ProductModel::whereIn('id', $productIds)->get()->keyBy('id');
        $variants = $variantIds->isNotEmpty()
            ? ProductVariantModel::whereIn('id', $variantIds)->get()->keyBy('id')
            : collect();

        // Toppings de todas las líneas con una sola consulta (sin N+1 por línea).
        $addonsById = $this->addonService->loadAddons(
            collect($items)->flatMap(fn (array $item) => collect($item['addons'] ?? [])->pluck('addon_id'))->filter()->unique()->all()
        );

        $totalDeltaSubtotal = 0.0;
        $orderProducts = (new OrderProductModel)->newCollection();

        foreach ($items as $item) {
            $variantId = $item['variant_id'] ?? null;
            $precio = $variantId
                ? (float) ($variants->get($variantId)?->precio ?? 0)
                : (float) ($products->get($item['producto_id'])?->precio ?? 0);
            $cantidad = (float) $item['cantidad'];
            $addonRows = $this->addonService->rowsFor($item['addons'] ?? [], $addonsById);

            $orderProduct = OrderProductModel::create([
                OrderProductModel::PRODUCTO_ID => $item['producto_id'],
                OrderProductModel::VARIANT_ID => $variantId,
                OrderProductModel::PEDIDO_ID => $order->id,
                OrderProductModel::CANTIDAD => $cantidad,
                OrderProductModel::PRECIO => $precio,
                OrderProductModel::DESCUENTO => 0,
                OrderProductModel::IS_READY => false,
            ]);
            $this->addonService->attach($orderProduct, $addonRows);
            $orderProducts->push($orderProduct);

            $totalDeltaSubtotal += $this->lineSubtotal($precio + $this->addonService->unitTotal($addonRows), $cantidad, 0);
        }

        return [$orderProducts, $totalDeltaSubtotal];
    }

    /**
     * update — usa el delta entre el subtotal de línea viejo y el nuevo para evitar un
     * recálculo completo por SUM.
     */
    public function updateProduct(OrderModel $order, OrderProductModel $orderProduct, OrderProductUpdateRequest $params): OrderProductModel
    {
        $orderDiscount = $order->descuento ?? 0;
        $orderProduct->loadMissing('addons');
        $oldLineSubtotal = $this->lineSubtotal($orderProduct->unitPriceWithAddons(), $orderProduct->cantidad, $orderProduct->descuento);

        $data = [];
        if (isset($params->cantidad)) {
            $data[OrderProductModel::CANTIDAD] = $params->cantidad;
        }
        if (isset($params->descuento)) {
            $data[OrderProductModel::DESCUENTO] = $params->descuento;
        }
        if (isset($params->variant_id)) {
            $data[OrderProductModel::VARIANT_ID] = $params->variant_id;
            $data[OrderProductModel::PRECIO] = ProductVariantModel::findOrFail($params->variant_id)->precio;
        } elseif ($orderProduct->nombre_extra && isset($params->precio)) {
            $data[OrderProductModel::PRECIO] = $params->precio;
        }

        OrderModel::lockForUpdate()->find($order->id);

        $orderProduct->update($data);

        // Con la llave "addons" presente se reemplaza el conjunto completo (vacío = quitar todos);
        // sin ella los toppings de la línea no se tocan.
        if ($params->has('addons') && $orderProduct->producto_id) {
            $this->addonService->replace($orderProduct, $this->addonService->rowsFor($params->input('addons') ?? []));
        }

        $orderProduct->refresh()->load('addons');

        $newLineSubtotal = $this->lineSubtotal($orderProduct->unitPriceWithAddons(), $orderProduct->cantidad, $orderProduct->descuento);
        $deltaSubtotal = $newLineSubtotal - $oldLineSubtotal;
        $this->applyOrderDeltaIncrement($order->id, $deltaSubtotal, $orderDiscount);

        $this->resetStatusIfReady($order->fresh());
        OrdersUpdated::dispatchAfterCommit('product_updated', (int) $order->id);

        return $orderProduct;
    }

    /**
     * toggleReady — decide (bajo el lock de $order, tomado por el controller) si este
     * cambio completa o rompe la condición de "todos listos" y promueve/revierte el
     * estatus de la orden en consecuencia.
     */
    public function toggleReady(OrderModel $order, OrderProductModel $orderProduct): OrderProductModel
    {
        $orderProduct->update([
            OrderProductModel::IS_READY => ! $orderProduct->is_ready,
        ]);

        if ($orderProduct->is_ready) {
            $this->restoreServedIfAllReady($order);
        } else {
            $this->resetStatusIfReady($order);
        }

        OrdersUpdated::dispatchAfterCommit('product_updated', (int) $order->id);

        return $orderProduct->refresh();
    }

    /**
     * updateNote — observación de una línea (producto o extra); vacía la deja en null.
     */
    public function updateNote(OrderModel $order, OrderProductModel $orderProduct, ?string $note): OrderProductModel
    {
        $orderProduct->update([OrderProductModel::OBSERVACION => $note ?: null]);

        $this->resetStatusIfReady($order);

        return $orderProduct->refresh();
    }

    /**
     * removeItem — borra una línea (producto o extra) de la orden y ajusta subtotal/total.
     * Usado tanto para borrar por producto_id como por el id propio del renglón (extra).
     */
    public function removeItem(OrderModel $order, OrderProductModel $item): void
    {
        $orderDiscount = $order->descuento ?? 0;
        $item->loadMissing('addons');
        $lineSubtotal = $this->lineSubtotal($item->unitPriceWithAddons(), $item->cantidad, $item->descuento);

        // Los toppings de la línea se borran en cascada (FK de order_product_addons).
        $item->delete();

        $this->applyOrderDeltaDecrement($order, $lineSubtotal, $orderDiscount);

        $this->restoreServedIfAllReady($order->fresh());
        OrdersUpdated::dispatchAfterCommit('product_updated', (int) $order->id);
    }

    /**
     * clearCart — borra todos los productos/extras de la orden en un solo paso.
     */
    public function clearCart(OrderModel $order): void
    {
        OrderProductModel::where('pedido_id', $order->id)->delete();

        DB::table('order')->where('id', $order->id)->update([
            'subtotal' => 0,
            'total' => 0,
        ]);

        OrdersUpdated::dispatchAfterCommit('product_updated', (int) $order->id);
    }

    public function resetStatusIfReady(OrderModel $order): void
    {
        if ($order->estatus_pedido_id === OrderStatusEnum::SERVED->value) {
            $order->update(['estatus_pedido_id' => OrderStatusEnum::IN_PROCESS->value]);
            OrdersUpdated::dispatchAfterCommit('updated', $order->id);
        }
    }

    /**
     * Tras borrar un producto, si la orden sigue InProcess y todos los restantes están
     * listos, la promueve de vuelta a Served automáticamente.
     */
    private function restoreServedIfAllReady(OrderModel $order): void
    {
        if ($order->estatus_pedido_id !== OrderStatusEnum::IN_PROCESS->value) {
            return;
        }

        $remaining = OrderProductModel::where('pedido_id', $order->id)->count();
        if ($remaining === 0) {
            return;
        }

        $hasUnready = OrderProductModel::where('pedido_id', $order->id)
            ->where('is_ready', false)
            ->exists();

        if (! $hasUnready) {
            $order->update(['estatus_pedido_id' => OrderStatusEnum::SERVED->value]);
            OrdersUpdated::dispatchAfterCommit('restored_served', $order->id);
        }
    }

    /**
     * resolveCatalogPrice — el precio de un producto de catálogo nunca se toma del
     * cliente: se resuelve aquí desde la variante seleccionada, o desde el precio
     * base del producto si no tiene variante. Cierra el hueco de que el cliente
     * pudiera mandar un precio arbitrario en el payload.
     */
    private function resolveCatalogPrice(int $productId, ?int $variantId): float
    {
        if ($variantId) {
            return (float) ProductVariantModel::findOrFail($variantId)->precio;
        }

        return (float) ProductModel::findOrFail($productId)->precio;
    }

    private function lineSubtotal(float $precio, float $cantidad, float $descuento): float
    {
        return round($precio * $cantidad * (1 - $descuento / 100), 2);
    }

    /**
     * Incrementa subtotal/total de forma atómica (COALESCE + delta) — usado cuando no se
     * necesita leer el valor actual primero (agregar/actualizar una línea).
     */
    private function applyOrderDeltaIncrement(int $orderId, float $deltaSubtotal, float $orderDiscount): void
    {
        $deltaTotal = round($deltaSubtotal * (1 - $orderDiscount / 100), 2);

        DB::table('order')->where('id', $orderId)->update([
            'subtotal' => DB::raw("COALESCE(subtotal, 0) + {$deltaSubtotal}"),
            'total' => DB::raw("COALESCE(total, 0) + {$deltaTotal}"),
        ]);
    }

    /**
     * Resta subtotal/total a partir de los valores ya cargados en $order (locked por el
     * controller), sin dejar que bajen de 0 — usado al borrar una línea.
     */
    private function applyOrderDeltaDecrement(OrderModel $order, float $lineSubtotal, float $orderDiscount): void
    {
        $lineTotal = round($lineSubtotal * (1 - $orderDiscount / 100), 2);

        DB::table('order')->where('id', $order->id)->update([
            'subtotal' => max(0, round(($order->subtotal ?? 0) - $lineSubtotal, 2)),
            'total' => max(0, round(($order->total ?? 0) - $lineTotal, 2)),
        ]);
    }
}
