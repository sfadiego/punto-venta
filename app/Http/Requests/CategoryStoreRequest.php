<?php

namespace App\Http\Requests;

use App\Models\CategoryModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoryStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        return [
            CategoryModel::NOMBRE => [
                'required', 'string', 'max:255',
                Rule::unique('categories', 'nombre')->where('tenant_id', $tenantId),
            ],
            CategoryModel::ORDEN => 'nullable|integer|min:0|max:2147483647',
            CategoryModel::FOTO_ID => 'nullable',
            CategoryModel::ICON_NAME => 'nullable|string|max:100',
        ];
    }
}
