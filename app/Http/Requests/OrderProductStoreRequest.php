<?php

namespace App\Http\Requests;

use App\Models\OrderProductModel;
use Illuminate\Foundation\Http\FormRequest;
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
        return [
            OrderProductModel::DESCUENTO => 'nullable|min:0|max:99',
            OrderProductModel::CANTIDAD => 'required|min:1',
            OrderProductModel::PRODUCTO_ID => 'nullable|exists:product,id',
            OrderProductModel::PRECIO => 'required|numeric|min:0',
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
        });
    }
}
