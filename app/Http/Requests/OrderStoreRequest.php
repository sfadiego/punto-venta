<?php

namespace App\Http\Requests;

use App\Models\OrderModel;
use Illuminate\Foundation\Http\FormRequest;

class OrderStoreRequest extends FormRequest
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
            OrderModel::TOTAL => 'required|numeric',
            OrderModel::SUBTOTAL => 'required|numeric',
            OrderModel::DESCUENTO => 'numeric|min:0|max:99',
            OrderModel::SISTEMA_ID => 'required|numeric|exists:main_order_report,id',
            OrderModel::NOMBRE_PEDIDO => 'required',
            OrderModel::ESTATUS_PEDIDO_ID => 'required|exists:order_status,id',
        ];
    }
}
