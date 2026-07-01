<?php

namespace App\Http\Requests;

use App\Enums\UnidadMedidaEnum;
use App\Models\ProductModel;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ProductModel::NOMBRE => 'required|string|max:255',
            ProductModel::PRECIO => 'required|decimal:0,2',
            ProductModel::DESCRIPCION => 'nullable',
            ProductModel::CATEGORIA_ID => 'required|exists:categories,id',
            ProductModel::ACTIVO => 'boolean',
            ProductModel::FOTO_ID => 'nullable|exists:product_image',
            ProductModel::UNIDAD_MEDIDA => ['nullable', Rule::enum(UnidadMedidaEnum::class)],
        ];
    }
}
