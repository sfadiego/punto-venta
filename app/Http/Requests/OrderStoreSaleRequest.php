<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OrderStoreSaleRequest extends FormRequest
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
            'sistema_id' => [
                'required', 'numeric',
                Rule::exists('main_order_report', 'id')->where('tenant_id', $tenantId),
            ],
            'nombre_pedido' => 'required|string',
            'costo_domicilio' => 'sometimes|numeric',
            'items' => 'required|array|min:1',
            'items.*.producto_id' => [
                'required', 'numeric',
                Rule::exists('product', 'id')->where('tenant_id', $tenantId),
            ],
            'items.*.variant_id' => [
                'nullable', 'numeric',
                Rule::exists('product_variants', 'id')->where('tenant_id', $tenantId),
            ],
            'items.*.cantidad' => 'required|numeric|min:0.001',
        ];
    }
}
