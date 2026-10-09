<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SlowMovingProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'days' => 'nullable|integer|min:1|max:365',
            'search' => 'nullable|string|max:100',
            // exists: no respeta global scopes — la categoría debe ser del tenant.
            'categoria_id' => ['nullable', 'integer', Rule::exists('categories', 'id')->where('tenant_id', app('tenant_id'))],
            'order' => 'nullable|in:asc,desc',
            'page' => 'nullable|integer|min:1',
            'limit' => 'nullable|integer|min:1|max:100',
        ];
    }
}
