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
                Rule::unique('product', 'nombre')->where('tenant_id', $tenantId)->ignore($productId),
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
        ];
    }

    public function attributes(): array
    {
        return [
            'categoria_id' => 'categoría',
            'picture_id' => 'imagen',
            'unidad_medida' => 'unidad de medida',
        ];
    }
}
