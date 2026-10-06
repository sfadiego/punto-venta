<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddonSyncProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        return [
            // "present" y no "required": un arreglo vacío es válido (quitar el topping de todos los productos).
            'product_ids' => ['present', 'array'],
            'product_ids.*' => [
                'integer',
                Rule::exists('product', 'id')->where('tenant_id', $tenantId)->whereNull('deleted_at'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'product_ids.present' => 'Indica los productos del topping.',
            'product_ids.array' => 'Los productos deben enviarse como lista.',
            'product_ids.*.integer' => 'Producto inválido.',
            'product_ids.*.exists' => 'Alguno de los productos no existe.',
        ];
    }
}
