<?php

namespace App\Http\Requests\Concerns;

use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use Illuminate\Validation\Validator;

/**
 * Validación de las líneas de catálogo de una request que agrega/reemplaza varias líneas de una
 * orden a la vez (alta en lote y sync): disponibilidad en la sucursal, variante del producto y
 * stock. Cada request decide cuánto de ese producto ya cuenta contra el stock
 * (quantityAlreadyInOrder).
 */
trait ValidatesOrderProductItems
{
    /** Cantidad del producto/variante que ya está en la orden y se suma a lo que pide la request. */
    abstract protected function quantityAlreadyInOrder(int $productId, ?int $variantId): float;

    protected function validateCatalogItems(Validator $validator, array $items, ?int $branchId): void
    {
        // Cantidad acumulada por (producto_id, variant_id) a través de TODA la request —
        // dos líneas del mismo producto en el mismo request deben sumarse entre sí antes
        // de comparar contra el stock disponible, no validarse cada una por separado
        // (si no, dos líneas de 3 unidades cada una podrían pasar individualmente contra
        // un stock de 5 y juntas sobregirarlo).
        $requestQuantityByKey = [];
        foreach ($items as $item) {
            $key = ($item['producto_id'] ?? 'x').':'.($item['variant_id'] ?? 'null');
            $requestQuantityByKey[$key] = ($requestQuantityByKey[$key] ?? 0) + (float) ($item['cantidad'] ?? 0);
        }

        // Productos (con sus sucursales, solo si la venta es de una sucursal) y variantes de todas
        // las líneas con una consulta cada uno, no una por línea.
        $products = ProductModel::whereIn('id', collect($items)->pluck('producto_id')->filter()->unique())
            ->when($branchId !== null, fn ($query) => $query->with('branches'))
            ->get()
            ->keyBy('id');
        $variants = ProductVariantModel::whereIn('id', collect($items)->pluck('variant_id')->filter()->unique())
            ->get()
            ->keyBy('id');

        foreach ($items as $index => $item) {
            $productoId = $item['producto_id'] ?? null;
            $variantId = $item['variant_id'] ?? null;
            if (! $productoId) {
                continue;
            }

            $product = $products->get($productoId);
            if (! $product) {
                continue;
            }

            if (! $product->isAvailableInBranch($branchId)) {
                $validator->errors()->add("items.{$index}.producto_id", "{$product->nombre} no está disponible en la sucursal de esta venta.");
            }

            if ($variantId) {
                $variant = $variants->get($variantId);
                if ($variant && $variant->product_id !== (int) $productoId) {
                    $validator->errors()->add("items.{$index}.variant_id", 'La variante no pertenece al producto seleccionado.');

                    continue;
                }

                if ($variant && $product->manage_stock && $variant->stock !== null) {
                    $totalRequested = $requestQuantityByKey[$productoId.':'.$variantId] ?? (float) $item['cantidad'];

                    if ($this->quantityAlreadyInOrder((int) $productoId, (int) $variantId) + $totalRequested > (float) $variant->stock) {
                        $validator->errors()->add(
                            "items.{$index}.cantidad",
                            "Stock insuficiente de {$product->nombre} ({$variant->nombre}). Disponible: {$variant->stock}.",
                        );
                    }
                }
            } elseif ($product->manage_stock) {
                $totalRequested = $requestQuantityByKey[$productoId.':null'] ?? (float) $item['cantidad'];

                if ($this->quantityAlreadyInOrder((int) $productoId, null) + $totalRequested > (float) $product->stock) {
                    $validator->errors()->add(
                        "items.{$index}.cantidad",
                        "Stock insuficiente de {$product->nombre}. Disponible: {$product->stock}.",
                    );
                }
            }
        }
    }
}
