<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TenantClearDemoDataRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'deep_clean' => 'boolean',
        ];
    }
}
