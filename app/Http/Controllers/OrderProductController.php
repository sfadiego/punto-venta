<?php

namespace App\Http\Controllers;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Http\Requests\OrderProductStoreRequest;
use App\Http\Requests\OrderProductUpdateRequest;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Services\OrderProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;

class OrderProductController extends Controller
{
    public function __construct(private readonly OrderProductService $service) {}

    /**
     * index
     */
    public function index(OrderModel $order): JsonResponse
    {
        return Response::success(
            OrderProductModel::with(['product', 'variant'])
                ->where('pedido_id', $order->id)
                ->get()
        );
    }

    /**
     * show
     */
    public function show(OrderModel $order, string $productId): JsonResponse
    {
        return Response::success(
            OrderProductModel::with(['product', 'variant'])->where('pedido_id', $order->id)
                ->where('producto_id', $productId)
                ->get()
        );
    }

    /**
     * store — agrega un producto (o extra) a la orden.
     */
    public function store(string $orderId, OrderProductStoreRequest $params): JsonResponse
    {
        $order = OrderModel::find($orderId);
        if ($error = $this->assertOrderEditable($order)) {
            return $error;
        }

        return Response::success($this->service->addProduct($order, $params));
    }

    /**
     * update — cambia cantidad o descuento de un producto de la orden.
     */
    public function update(string $orderId, string $productId, OrderProductUpdateRequest $params): JsonResponse
    {
        $orderProduct = OrderProductModel::where('pedido_id', $orderId)
            ->where('id', $productId)
            ->first();

        if (! $orderProduct) {
            return Response::error('La orden no contiene este producto');
        }

        $order = OrderModel::find($orderId);
        if ($error = $this->assertOrderEditable($order)) {
            return $error;
        }

        return Response::success($this->service->updateProduct($order, $orderProduct, $params));
    }

    /**
     * toggleReady — marca/desmarca un order_product como listo para servir.
     */
    public function toggleReady(int $orderId, int $item): JsonResponse
    {
        $orderProduct = OrderProductModel::where('pedido_id', $orderId)
            ->where('id', $item)
            ->first();

        if (! $orderProduct) {
            return Response::error('elemento no encontrado');
        }

        $order = OrderModel::lockForUpdate()->find($orderId);
        if (! $order) {
            return Response::error('no existe la orden');
        }

        return Response::success($this->service->toggleReady($order, $orderProduct));
    }

    /**
     * updateNote — actualiza la observación por id de order_product (aplica a productos y extras).
     */
    public function updateNote(int $orderId, int $item, Request $request): JsonResponse
    {
        $orderProduct = OrderProductModel::where('pedido_id', $orderId)
            ->where('id', $item)
            ->first();

        if (! $orderProduct) {
            return Response::error('elemento no encontrado');
        }

        $orderProduct->update([
            OrderProductModel::OBSERVACION => $request->input('observacion') ?: null,
        ]);

        $order = OrderModel::find($orderId);
        $this->service->resetStatusIfReady($order);

        return Response::success($orderProduct->refresh());
    }

    /**
     * deleteExtra — borra cualquier order_product por su propio id.
     */
    public function deleteExtra(int $orderId, int $extra): JsonResponse
    {
        $order = OrderModel::lockForUpdate()->find($orderId);
        if ($error = $this->assertOrderEditable($order)) {
            return $error;
        }

        $item = OrderProductModel::where('pedido_id', $orderId)
            ->where('id', $extra)
            ->first();

        if (! $item) {
            return Response::error('elemento no encontrado');
        }

        $this->service->removeItem($order, $item);

        return Response::success('elemento borrado de la orden');
    }

    /**
     * clearCart — borra todos los order_product (productos y extras) de la orden en un paso.
     */
    public function clearCart(int $orderId): JsonResponse
    {
        $order = OrderModel::lockForUpdate()->find($orderId);
        if ($error = $this->assertOrderEditable($order)) {
            return $error;
        }

        $this->service->clearCart($order);

        return Response::success('carrito vaciado');
    }

    /**
     * delete — borra un producto regular de la orden por producto_id.
     */
    public function delete(int $orderId, int $product): JsonResponse
    {
        $order = OrderModel::lockForUpdate()->find($orderId);
        if ($error = $this->assertOrderEditable($order)) {
            return $error;
        }

        $item = OrderProductModel::where('pedido_id', $orderId)
            ->where('producto_id', $product)
            ->first();

        if (! $item) {
            Log::error('producto no encontrado', [$product]);

            return Response::error('producto no encontrado');
        }

        $this->service->removeItem($order, $item);

        return Response::success('elemento borrado de la orden');
    }

    /**
     * assertOrderEditable — solo InProcess/Served aceptan modificaciones de productos.
     * Bloquea agregar/editar/borrar productos en órdenes ya cerradas, aunque el
     * cliente envíe la petición (ej. UI desincronizada por caché stale en red lenta).
     */
    private function assertOrderEditable(?OrderModel $order): ?JsonResponse
    {
        if (! $order) {
            return Response::error('no existe la orden');
        }

        $editableStatuses = [OrderStatusEnum::IN_PROCESS->value, OrderStatusEnum::SERVED->value];
        if (! in_array($order->estatus_pedido_id, $editableStatuses, true)) {
            return Response::error('La orden ya fue cerrada y no se puede modificar');
        }

        if ($order->sistema && $order->sistema->estatus_caja !== MainOrderStatusEnum::OPEN->value) {
            return Response::error('La caja de esta venta ya está cerrada.');
        }

        return null;
    }
}
