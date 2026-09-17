<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TenantBranchStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->route('tenant')?->id;

        return [
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('branches', 'name')->where('tenant_id', $tenantId)->whereNull('deleted_at'),
            ],
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
        ];
    }
}
