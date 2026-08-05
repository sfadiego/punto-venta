<?php

namespace App\Http\Requests;

use App\Models\ProviderModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProviderStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        return [
            ProviderModel::NAME => [
                'required', 'string', 'max:255',
                Rule::unique('providers', 'name')->where('tenant_id', $tenantId),
            ],
            ProviderModel::PHONE => 'nullable|string|max:20',
            ProviderModel::CONTACT_NAME => 'nullable|string|max:255',
            ProviderModel::NOTES => 'nullable|string|max:1000',
        ];
    }
}
