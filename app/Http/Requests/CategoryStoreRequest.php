<?php

namespace App\Http\Requests;

use App\Models\CategoryModel;
use Illuminate\Foundation\Http\FormRequest;

class CategoryStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            CategoryModel::NOMBRE => 'required|string|max:255|unique:categories,nombre',
            CategoryModel::ORDEN => 'nullable|integer|min:0|max:2147483647',
            CategoryModel::FOTO_ID => 'nullable',
            CategoryModel::ICON_NAME => 'nullable|string|max:100',
        ];
    }
}
