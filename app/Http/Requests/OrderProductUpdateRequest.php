<?php

namespace App\Http\Requests;

use App\Models\OrderProductModel;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class OrderProductUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        return [
            OrderProductModel::DESCUENTO => 'numeric|max:99|min:0',
            OrderProductModel::CANTIDAD => 'numeric|min:0.001|max:99',
            OrderProductModel::PRECIO => 'numeric|min:0|max:99999',
            OrderProductModel::VARIANT_ID => [
                'nullable',
                Rule::exists('product_variants', 'id')->where('tenant_id', $tenantId),
            ],
            OrderProductModel::OBSERVACION => 'nullable|string|max:200',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (! isset($this->cantidad)) {
                return;
            }

            $orderProduct = OrderProductModel::find($this->route('product'));
            if (! $orderProduct || ! $orderProduct->producto_id) {
                return;
            }

            // Igual que en OrderProductStoreRequest: el stock se descuenta recién al cerrar la
            // orden, pero la reserva en el carrito se valida aquí también (no solo en el
            // frontend). variant_id puede venir en el mismo request (cambio de variante) o
            // heredarse de la línea existente. Una línea con variante valida contra el stock
            // de esa variante, no el del producto base (ver StockService).
            $effectiveVariantId = $this->has('variant_id') ? $this->variant_id : $orderProduct->variant_id;

            if ($effectiveVariantId) {
                $variant = ProductVariantModel::find($effectiveVariantId);
                $product = $variant?->product;

                if ($product && $product->manage_stock && $variant->stock !== null && (float) $this->cantidad > (float) $variant->stock) {
                    $validator->errors()->add(
                        'cantidad',
                        "Stock insuficiente de {$product->nombre} ({$variant->nombre}). Disponible: {$variant->stock}.",
                    );
                }

                return;
            }

            $product = ProductModel::find($orderProduct->producto_id);
            if ($product && $product->manage_stock && (float) $this->cantidad > (float) $product->stock) {
                $validator->errors()->add(
                    'cantidad',
                    "Stock insuficiente de {$product->nombre}. Disponible: {$product->stock}.",
                );
            }
        });
    }
}
