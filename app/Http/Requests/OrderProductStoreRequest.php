<?php

namespace App\Http\Requests;

use App\Models\OrderProductModel;
use App\Models\ProductVariantModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class OrderProductStoreRequest extends FormRequest
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
            OrderProductModel::DESCUENTO => 'nullable|numeric|min:0|max:99',
            OrderProductModel::CANTIDAD => $this->nombre_extra
                ? 'required|integer|min:1|max:99'
                : 'required|numeric|min:0.001|max:99',
            OrderProductModel::PRODUCTO_ID => [
                'nullable',
                Rule::exists('product', 'id')->where('tenant_id', $tenantId),
            ],
            OrderProductModel::VARIANT_ID => [
                'nullable',
                Rule::exists('product_variants', 'id')->where('tenant_id', $tenantId),
            ],
            OrderProductModel::PRECIO => $this->nombre_extra
                ? 'required|numeric|min:0|max:99999'
                : 'nullable|numeric|min:0|max:99999',
            OrderProductModel::NOMBRE_EXTRA => 'nullable|string|max:255',
            OrderProductModel::OBSERVACION => 'nullable|string|max:200',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            if (! $this->producto_id && ! $this->nombre_extra) {
                $validator->errors()->add('producto_id', 'Se requiere un producto o un nombre de extra.');
            }

            if ($this->variant_id && $this->producto_id) {
                $belongsToProduct = ProductVariantModel::where('id', $this->variant_id)
                    ->where(ProductVariantModel::PRODUCT_ID, $this->producto_id)
                    ->exists();

                if (! $belongsToProduct) {
                    $validator->errors()->add('variant_id', 'La variante no pertenece al producto seleccionado.');
                }
            }
        });
    }
}
