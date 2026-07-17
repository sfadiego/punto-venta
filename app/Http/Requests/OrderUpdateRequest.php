<?php

namespace App\Http\Requests;

use App\Models\OrderModel;
use Illuminate\Foundation\Http\FormRequest;

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
        return [
            OrderModel::DESCUENTO => 'numeric|min:0|max:99',
            OrderModel::NOMBRE_PEDIDO => 'nullable|string|max:255',
            OrderModel::ESTATUS_PEDIDO_ID => 'exists:order_status,id',
            OrderModel::PAYMENT_METHOD_ID => 'nullable|exists:payment_methods,id',
            OrderModel::PROPINA => 'nullable|numeric|min:0',
            OrderModel::COSTO_DOMICILIO => 'sometimes|nullable|numeric',
        ];
    }
}
