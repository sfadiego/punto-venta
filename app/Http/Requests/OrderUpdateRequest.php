<?php

namespace App\Http\Requests;

use App\Models\CustomerModel;
use App\Models\OrderModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class OrderUpdateRequest extends FormRequest
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
            OrderModel::DESCUENTO => 'numeric|min:0|max:99',
            OrderModel::NOMBRE_PEDIDO => 'nullable|string|max:255',
            OrderModel::ESTATUS_PEDIDO_ID => 'exists:order_status,id',
            OrderModel::PAYMENT_METHOD_ID => 'nullable|exists:payment_methods,id',
            OrderModel::PROPINA => 'nullable|numeric|min:0',
            OrderModel::COSTO_DOMICILIO => 'sometimes|nullable|numeric',
            OrderModel::IS_CREDIT => 'sometimes|boolean',
            OrderModel::CUSTOMER_ID => [
                'nullable',
                Rule::exists('customers', 'id')->where('tenant_id', $tenantId),
                'required_if:'.OrderModel::IS_CREDIT.',true',
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->boolean(OrderModel::IS_CREDIT) && $this->filled(OrderModel::CUSTOMER_ID)) {
                $customer = CustomerModel::find($this->input(OrderModel::CUSTOMER_ID));
                if (! $customer || ! $customer->allow_credit) {
                    $validator->errors()->add(OrderModel::CUSTOMER_ID, 'Este cliente no tiene crédito habilitado.');
                }
            }
        });
    }
}
