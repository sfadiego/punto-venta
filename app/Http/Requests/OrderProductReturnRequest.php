<?php

namespace App\Http\Requests;

use App\Enums\OrderStatusEnum;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class OrderProductReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quantity' => ['required', 'numeric', 'min:0.001'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'quantity.required' => 'La cantidad a devolver es requerida.',
            'quantity.numeric' => 'La cantidad a devolver debe ser un número válido.',
            'quantity.min' => 'La cantidad a devolver debe ser mayor a cero.',
            'note.max' => 'La nota no puede superar los 255 caracteres.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $order = OrderModel::find($this->route('order'));

            if (! $order) {
                $validator->errors()->add('order', 'La orden no existe.');

                return;
            }

            if ($order->estatus_pedido_id !== OrderStatusEnum::CLOSED->value) {
                $validator->errors()->add('order', 'Solo se pueden devolver productos de órdenes ya cerradas.');

                return;
            }

            $orderProduct = OrderProductModel::where(OrderProductModel::PEDIDO_ID, $order->id)
                ->where('id', $this->route('item'))
                ->first();

            if (! $orderProduct || ! $orderProduct->producto_id) {
                $validator->errors()->add('item', 'La orden no contiene este producto.');
            }
        });
    }
}
