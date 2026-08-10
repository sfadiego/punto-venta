<?php

namespace App\Http\Requests;

use App\Enums\UnidadMedidaEnum;
use App\Models\ProductModel;
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $productId = $this->route('product')?->id;
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        return [
            ProductModel::NOMBRE => [
                'required', 'string', 'max:70',
                Rule::unique('product', 'nombre')->where('tenant_id', $tenantId)->ignore($productId)->whereNull('deleted_at'),
            ],
            ProductModel::PRECIO => 'required|decimal:0,2',
            ProductModel::DESCRIPCION => 'nullable',
            ProductModel::CATEGORIA_ID => [
                'required',
                Rule::exists('categories', 'id')->where('tenant_id', $tenantId),
            ],
            ProductModel::ACTIVO => 'boolean',
            'picture_id' => [
                'nullable',
                Rule::exists('product_image', 'id')->where('tenant_id', $tenantId),
            ],
            ProductModel::UNIDAD_MEDIDA => ['nullable', Rule::enum(UnidadMedidaEnum::class)],
            ProductModel::MANAGE_STOCK => 'nullable|boolean',
            ProductModel::MIN_STOCK => 'nullable|numeric|min:0',
            ProductModel::PRODUCT_CODE => [
                'nullable', 'string', 'max:64',
                Rule::unique('product', 'product_code')->where('tenant_id', $tenantId)->ignore($productId)->whereNull('deleted_at'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre es requerido.',
            'nombre.string' => 'El nombre debe ser texto.',
            'nombre.max' => 'El nombre no puede superar los 70 caracteres.',
            'nombre.unique' => 'Ya existe un producto con este nombre.',
            'precio.required' => 'El precio es requerido.',
            'precio.decimal' => 'El precio debe ser un número válido con hasta 2 decimales.',
            'categoria_id.required' => 'La categoría es requerida.',
            'categoria_id.exists' => 'La categoría seleccionada no es válida.',
            'activo.boolean' => 'El campo disponible debe ser verdadero o falso.',
            'picture_id.exists' => 'La imagen seleccionada no es válida.',
            'unidad_medida.enum' => 'La unidad de medida seleccionada no es válida.',
            'manage_stock.boolean' => 'El campo maneja stock debe ser verdadero o falso.',
            'min_stock.numeric' => 'El stock mínimo debe ser un número válido.',
            'min_stock.min' => 'El stock mínimo no puede ser negativo.',
            'product_code.max' => 'El código de barras no puede superar los 64 caracteres.',
            'product_code.unique' => 'Ya existe un producto con este código de barras.',
        ];
    }

    public function attributes(): array
    {
        return [
            'categoria_id' => 'categoría',
            'picture_id' => 'imagen',
            'unidad_medida' => 'unidad de medida',
            'manage_stock' => 'maneja stock',
            'min_stock' => 'stock mínimo',
            'product_code' => 'código de barras',
        ];
    }
}
