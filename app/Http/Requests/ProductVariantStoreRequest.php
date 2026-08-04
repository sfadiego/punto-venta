<?php

namespace App\Http\Requests;

use App\Models\ProductVariantModel;
use Illuminate\Foundation\Http\FormRequest;

class ProductVariantStoreRequest extends FormRequest
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
            ProductVariantModel::NOMBRE => 'required|string|max:100',
            ProductVariantModel::PRECIO => 'required|decimal:0,2',
            ProductVariantModel::ORDEN => 'nullable|integer|min:0',
            ProductVariantModel::ACTIVO => 'bool',
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre de la variante es requerido.',
            'nombre.max' => 'El nombre no puede superar los 100 caracteres.',
            'precio.required' => 'El precio es requerido.',
            'precio.decimal' => 'El precio debe ser un número válido con hasta 2 decimales.',
        ];
    }
}
