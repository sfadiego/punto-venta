<?php

namespace App\Http\Requests;

use App\Models\CategoryModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoryUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $categoryId = $this->route('category')?->id;
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        return [
            CategoryModel::NOMBRE => [
                'required', 'string', 'max:255',
                Rule::unique('categories', 'nombre')->where('tenant_id', $tenantId)->ignore($categoryId),
            ],
            CategoryModel::ORDEN => 'nullable|integer|min:0|max:2147483647',
            CategoryModel::FOTO_ID => 'nullable',
            CategoryModel::ICON_NAME => 'nullable|string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre es requerido.',
            'nombre.string' => 'El nombre debe ser texto.',
            'nombre.max' => 'El nombre no puede superar los 255 caracteres.',
            'nombre.unique' => 'Ya existe una categoría con este nombre.',
            'orden.integer' => 'El orden debe ser un número entero.',
            'orden.min' => 'El orden no puede ser negativo.',
            'orden.max' => 'El orden es demasiado grande.',
            'icon_name.string' => 'El ícono debe ser texto.',
            'icon_name.max' => 'El ícono no puede superar los 100 caracteres.',
        ];
    }

    public function attributes(): array
    {
        return [
            'icon_name' => 'ícono',
        ];
    }
}
