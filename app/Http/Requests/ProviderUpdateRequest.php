<?php

namespace App\Http\Requests;

use App\Models\ProviderModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProviderUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;
        $providerId = $this->route('provider')?->id;

        return [
            ProviderModel::NAME => [
                'required', 'string', 'max:255',
                Rule::unique('providers', 'name')->where('tenant_id', $tenantId)->ignore($providerId),
            ],
            ProviderModel::PHONE => 'nullable|string|max:20',
            ProviderModel::CONTACT_NAME => 'nullable|string|max:255',
            ProviderModel::NOTES => 'nullable|string|max:1000',
        ];
    }
}
