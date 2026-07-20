<?php

namespace App\Http\Requests;

use App\Models\CustomerModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CustomerUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;
        $customerId = $this->route('customer')?->id;

        return [
            CustomerModel::NAME => [
                'required', 'string', 'max:255',
                Rule::unique('customers', 'name')->where('tenant_id', $tenantId)->ignore($customerId),
            ],
            CustomerModel::PHONE => 'nullable|string|max:20',
            CustomerModel::NOTES => 'nullable|string|max:1000',
        ];
    }
}
