<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesOpenSistema;
use App\Models\OrderModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class OrderStoreRequest extends FormRequest
{
    use ValidatesOpenSistema;

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
            OrderModel::TOTAL => 'required|numeric',
            OrderModel::SUBTOTAL => 'required|numeric',
            OrderModel::DESCUENTO => 'numeric|min:0|max:99',
            OrderModel::SISTEMA_ID => [
                'required', 'numeric',
                Rule::exists('main_order_report', 'id')->where('tenant_id', $tenantId),
            ],
            OrderModel::NOMBRE_PEDIDO => 'required|string|max:255',
            OrderModel::ESTATUS_PEDIDO_ID => 'required|exists:order_status,id',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;
            $this->assertSistemaAbierto($validator, $tenantId);
        });
    }
}
