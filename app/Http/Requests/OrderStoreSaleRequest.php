<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
        return [
            'sistema_id' => 'required|numeric|exists:main_order_report,id',
            'nombre_pedido' => 'required|string',
            'costo_domicilio' => 'sometimes|numeric',
            'items' => 'required|array|min:1',
            'items.*.producto_id' => 'required|numeric|exists:product,id',
            'items.*.cantidad' => 'required|numeric|min:0.001',
            'items.*.precio' => 'required|numeric|min:0',
        ];
    }
}
