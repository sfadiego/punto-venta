<?php

namespace App\Http\Requests;

use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Alta en lote de productos de catálogo a una orden — usado por el checkout de QuickSale
 * (un solo request por todo el carrito, en vez de un POST por línea vía
 * OrderProductStoreRequest). Solo cubre productos de catálogo (producto_id/variant_id), no
 * "extras" con nombre libre — el carrito de QuickSale nunca los trae.
 */
class OrderProductBatchStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        return [
            'items' => 'required|array|min:1|max:100',
            'items.*.'.OrderProductModel::PRODUCTO_ID => [
                'required',
                Rule::exists('product', 'id')->where('tenant_id', $tenantId),
            ],
            'items.*.'.OrderProductModel::VARIANT_ID => [
                'nullable',
                Rule::exists('product_variants', 'id')->where('tenant_id', $tenantId),
            ],
            'items.*.'.OrderProductModel::CANTIDAD => 'required|numeric|min:0.001|max:99',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $items = $this->input('items', []);
            $order = OrderModel::find($this->route('order'));
            $branchId = $order?->sistema?->branch_id;

            // Cantidad acumulada por (producto_id, variant_id) a través de TODO el batch —
            // dos líneas del mismo producto en el mismo request deben sumarse entre sí antes
            // de comparar contra el stock disponible, no validarse cada una por separado
            // (si no, dos líneas de 3 unidades cada una podrían pasar individualmente contra
            // un stock de 5 y juntas sobregirarlo).
            $batchQuantityByKey = [];
            foreach ($items as $item) {
                $key = ($item['producto_id'] ?? 'x').':'.($item['variant_id'] ?? 'null');
                $batchQuantityByKey[$key] = ($batchQuantityByKey[$key] ?? 0) + (float) ($item['cantidad'] ?? 0);
            }

            foreach ($items as $index => $item) {
                $productoId = $item['producto_id'] ?? null;
                $variantId = $item['variant_id'] ?? null;
                if (! $productoId) {
                    continue;
                }

                $product = ProductModel::find($productoId);
                if (! $product) {
                    continue;
                }

                if ($product && ! $product->isAvailableInBranch($branchId)) {
                    $validator->errors()->add("items.{$index}.producto_id", "{$product->nombre} no está disponible en la sucursal de esta venta.");
                }

                if ($variantId) {
                    $variant = ProductVariantModel::find($variantId);
                    if ($variant && $variant->product_id !== (int) $productoId) {
                        $validator->errors()->add("items.{$index}.variant_id", 'La variante no pertenece al producto seleccionado.');

                        continue;
                    }

                    if ($variant && $product->manage_stock && $variant->stock !== null) {
                        $alreadyInOrder = (float) OrderProductModel::where(OrderProductModel::PEDIDO_ID, $this->route('order'))
                            ->where(OrderProductModel::VARIANT_ID, $variantId)
                            ->sum(OrderProductModel::CANTIDAD);

                        $key = $productoId.':'.$variantId;
                        $totalRequested = $batchQuantityByKey[$key] ?? (float) $item['cantidad'];

                        if ($alreadyInOrder + $totalRequested > (float) $variant->stock) {
                            $validator->errors()->add(
                                "items.{$index}.cantidad",
                                "Stock insuficiente de {$product->nombre} ({$variant->nombre}). Disponible: {$variant->stock}.",
                            );
                        }
                    }
                } elseif ($product->manage_stock) {
                    $alreadyInOrder = (float) OrderProductModel::where(OrderProductModel::PEDIDO_ID, $this->route('order'))
                        ->where(OrderProductModel::PRODUCTO_ID, $productoId)
                        ->whereNull(OrderProductModel::VARIANT_ID)
                        ->sum(OrderProductModel::CANTIDAD);

                    $key = $productoId.':null';
                    $totalRequested = $batchQuantityByKey[$key] ?? (float) $item['cantidad'];

                    if ($alreadyInOrder + $totalRequested > (float) $product->stock) {
                        $validator->errors()->add(
                            "items.{$index}.cantidad",
                            "Stock insuficiente de {$product->nombre}. Disponible: {$product->stock}.",
                        );
                    }
                }
            }
        });
    }
}
