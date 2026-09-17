<?php

namespace App\Http\Requests;

use App\Models\BranchModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BranchStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        return [
            BranchModel::NAME => [
                'required', 'string', 'max:100',
                Rule::unique('branches', 'name')->where('tenant_id', $tenantId)->whereNull('deleted_at'),
            ],
            BranchModel::ADDRESS => 'nullable|string|max:500',
            BranchModel::PHONE => 'nullable|string|max:20',
            BranchModel::ACTIVE => 'sometimes|boolean',
        ];
    }
}
