<?php

namespace App\Http\Requests;

use App\Models\ProductModel;
use Illuminate\Foundation\Http\FormRequest;

class ProductUpdateRequest extends FormRequest
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
            ProductModel::NOMBRE => 'required',
            ProductModel::PRECIO => 'required|decimal:0,2',
            ProductModel::DESCRIPCION => 'required',
            ProductModel::CATEGORIA_ID => 'required|exists:categories,id',
            ProductModel::ACTIVO => 'boolean',
            ProductModel::FOTO_ID => 'nullable|exists:product_image',
        ];
    }
}
