<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TenantBranchUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->route('tenant')?->id;
        $branchId = $this->route('branch');

        return [
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('branches', 'name')->where('tenant_id', $tenantId)->whereNull('deleted_at')->ignore($branchId),
            ],
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
        ];
    }
}
