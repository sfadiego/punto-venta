<?php

namespace App\Services;

use App\Models\AddonModel;
use App\Models\OrderProductAddonModel;
use App\Models\OrderProductModel;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Toppings elegidos en una línea de orden. Servicio plano de lógica de negocio (no hereda de
 * DataTable). El precio y el nombre se copian al momento de vender: cambiar o borrar el
 * topping del catálogo no altera ventas pasadas, y el precio nunca se toma del cliente.
 */
class OrderProductAddonService
{
    /**
     * Valida, para varias líneas a la vez, que cada topping elegido exista y esté activo, se
     * ofrezca en el producto de su línea y no se repita dentro de ella. Una sola consulta de
     * toppings y una de asignaciones sin importar cuántas líneas lleguen (checkout en lote).
     *
     * @param  array<string, array{producto_id: ?int, addons: array}>  $lines  clave = prefijo del campo en los errores ('' o 'items.3')
     * @return array<string, string> mensajes de error por campo
     */
    public function validationErrors(array $lines): array
    {
        $addonIds = collect($lines)
            ->flatMap(fn (array $line) => collect($line['addons'] ?? [])->pluck('addon_id'))
            ->filter()
            ->unique()
            ->values();

        if ($addonIds->isEmpty()) {
            return [];
        }

        $productIds = collect($lines)->pluck('producto_id')->filter()->unique()->values();
        $addons = AddonModel::whereIn('id', $addonIds)->get()->keyBy('id');
        $assigned = DB::table('addon_product')
            ->whereIn('addon_id', $addonIds)
            ->whereIn('product_id', $productIds)
            ->get()
            ->mapWithKeys(fn ($row) => [$row->product_id.':'.$row->addon_id => true]);

        $errors = [];
        foreach ($lines as $prefix => $line) {
            $seen = [];
            foreach (($line['addons'] ?? []) as $index => $row) {
                $addonId = $row['addon_id'] ?? null;
                $addon = $addonId ? $addons->get((int) $addonId) : null;
                // Un id faltante o inexistente ya lo reportan las reglas básicas del request.
                if (! $addon) {
                    continue;
                }

                $field = ($prefix === '' ? '' : $prefix.'.').'addons.'.$index.'.addon_id';
                $productId = $line['producto_id'] ?? null;

                if (! $productId) {
                    $errors[$field] = 'Los extras no admiten toppings.';
                } elseif (isset($seen[$addon->id])) {
                    $errors[$field] = "El topping \"{$addon->name}\" está repetido en la línea.";
                } elseif (! $addon->is_active) {
                    $errors[$field] = "El topping \"{$addon->name}\" no está disponible.";
                } elseif (! $assigned->has((int) $productId.':'.$addon->id)) {
                    $errors[$field] = "El topping \"{$addon->name}\" no se ofrece con este producto.";
                }

                $seen[$addon->id] = true;
            }
        }

        return $errors;
    }

    /** @param  array<int>  $ids */
    public function loadAddons(array $ids): Collection
    {
        if ($ids === []) {
            return collect();
        }

        return AddonModel::whereIn('id', $ids)->get()->keyBy('id');
    }

    /**
     * Arma las filas a guardar con la copia de nombre y precio del catálogo.
     *
     * @param  array<array{addon_id: int, quantity: int}>  $input
     * @return array<array{addon_id: int, name: string, price: float, quantity: int}>
     */
    public function rowsFor(array $input, ?Collection $addonsById = null): array
    {
        if ($input === []) {
            return [];
        }

        $addonsById ??= $this->loadAddons(collect($input)->pluck('addon_id')->all());

        return collect($input)
            ->map(function (array $row) use ($addonsById) {
                $addon = $addonsById->get((int) $row['addon_id']);

                return $addon ? [
                    OrderProductAddonModel::ADDON_ID => $addon->id,
                    OrderProductAddonModel::NAME => $addon->name,
                    OrderProductAddonModel::PRICE => (float) $addon->price,
                    OrderProductAddonModel::QUANTITY => (int) $row['quantity'],
                ] : null;
            })
            ->filter()
            ->values()
            ->all();
    }

    /** Suma de los toppings por UNA unidad de la línea (la cantidad de la línea los multiplica después). */
    public function unitTotal(array $rows): float
    {
        return round(collect($rows)->sum(
            fn (array $row) => $row[OrderProductAddonModel::PRICE] * $row[OrderProductAddonModel::QUANTITY]
        ), 2);
    }

    public function attach(OrderProductModel $orderProduct, array $rows): void
    {
        if ($rows !== []) {
            $orderProduct->addons()->createMany($rows);
        }
    }

    /** Reemplaza el conjunto completo de toppings de la línea. */
    public function replace(OrderProductModel $orderProduct, array $rows): void
    {
        $orderProduct->addons()->delete();
        $this->attach($orderProduct, $rows);
        $orderProduct->unsetRelation('addons');
    }
}
