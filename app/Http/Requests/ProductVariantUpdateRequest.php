<?php

namespace App\Http\Requests;

use App\Models\ProductVariantModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ProductVariantUpdateRequest extends FormRequest
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
            ProductVariantModel::NOMBRE => 'sometimes|string|max:100',
            ProductVariantModel::PRECIO => 'sometimes|decimal:0,2',
            ProductVariantModel::ORDEN => 'nullable|integer|min:0',
            ProductVariantModel::ACTIVO => 'bool',
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.max' => 'El nombre no puede superar los 100 caracteres.',
            'precio.decimal' => 'El precio debe ser un número válido con hasta 2 decimales.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $product = $this->route('product');
            $variant = $this->route('variant');

            if ($product && $variant && $variant->product_id !== $product->id) {
                $validator->errors()->add('variant', 'La variante no pertenece a este producto.');
            }
        });
    }
}
