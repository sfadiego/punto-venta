<?php

namespace App\Http\Requests;

use App\Models\OrderProductModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
}
