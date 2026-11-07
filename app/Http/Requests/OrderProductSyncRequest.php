<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesOrderProductItems;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Carrito final de una orden retomada en QuickSale: el servidor deja sus líneas de catálogo
 * iguales a `items` (ver OrderProductService::syncProducts). `items` puede ir vacío (vaciar el
 * carrito). Solo productos de catálogo, sin toppings ni extras — el carrito de QuickSale no
 * los trae.
 */
class OrderProductSyncRequest extends FormRequest
{
    use ValidatesOrderProductItems;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        return [
            'items' => 'present|array|max:100',
            // numeric, no integer: el cliente manda ids temporales decimales para las líneas que aún no existen.
            'items.*.order_product_id' => 'nullable|numeric',
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

    // `items` ya es el estado final de las líneas de catálogo: nada de lo que hay hoy en la
    // orden se suma al stock que pide la request.
    protected function quantityAlreadyInOrder(int $productId, ?int $variantId): float
    {
        return 0.0;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $order = OrderModel::find($this->route('order'));

            $this->validateCatalogItems($validator, $this->input('items', []), $order?->sistema?->branch_id);
        });
    }
}
