<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesOrderProductAddons;
use App\Http\Requests\Concerns\ValidatesOrderProductItems;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
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
    use ValidatesOrderProductAddons;
    use ValidatesOrderProductItems;

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
            ...$this->addonRules('items.*.'),
        ];
    }

    public function messages(): array
    {
        return collect($this->addonMessages())
            ->mapWithKeys(fn (string $message, string $key) => ['items.*.'.$key => $message])
            ->all();
    }

    protected function quantityAlreadyInOrder(int $productId, ?int $variantId): float
    {
        $query = OrderProductModel::where(OrderProductModel::PEDIDO_ID, $this->route('order'));

        return (float) ($variantId
            ? $query->where(OrderProductModel::VARIANT_ID, $variantId)->sum(OrderProductModel::CANTIDAD)
            : $query->where(OrderProductModel::PRODUCTO_ID, $productId)->whereNull(OrderProductModel::VARIANT_ID)->sum(OrderProductModel::CANTIDAD));
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $items = $this->input('items', []);

            // Toppings de todas las líneas en una sola pasada (sin consultas por línea).
            $addonLines = [];
            foreach ($items as $index => $item) {
                $addonLines["items.{$index}"] = [
                    'producto_id' => isset($item['producto_id']) ? (int) $item['producto_id'] : null,
                    'addons' => $item['addons'] ?? null,
                ];
            }
            $this->validateAddonSelections($validator, $addonLines);

            $order = OrderModel::find($this->route('order'));
            $branchId = $order?->sistema?->branch_id;

            $this->validateCatalogItems($validator, $items, $branchId);
        });
    }
}
