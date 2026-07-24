<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ClientErrorStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'message' => 'required|string|max:1000',
            'stack' => 'nullable|string|max:5000',
            'url' => 'nullable|string|max:500',
            'context' => 'nullable|string|max:200',
            'level' => 'nullable|string|max:20',
            'tenant_slug' => 'nullable|string|max:100',
            'user_id' => 'nullable|integer',
            'usuario' => 'nullable|string|max:100',
            'error_type' => 'nullable|string|max:20',
            'error_code' => 'nullable|string|max:50',
            'failed_endpoint' => 'nullable|string|max:500',
            'failed_method' => 'nullable|string|max:10',
            'failed_status' => 'nullable|integer',
        ];
    }
}
