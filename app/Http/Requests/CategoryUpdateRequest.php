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

        return [
            CategoryModel::NOMBRE => ['required', 'string', 'max:255', Rule::unique('categories', 'nombre')->ignore($categoryId)],
            CategoryModel::ORDEN => 'nullable|integer|min:0|max:2147483647',
            CategoryModel::FOTO_ID => 'nullable',
            CategoryModel::ICON_NAME => 'nullable|string|max:100',
        ];
    }
}
