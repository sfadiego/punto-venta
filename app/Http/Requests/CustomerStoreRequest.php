<?php

namespace App\Http\Requests;

use App\Models\CustomerModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CustomerStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        return [
            CustomerModel::NAME => [
                'required', 'string', 'max:255',
                Rule::unique('customers', 'name')->where('tenant_id', $tenantId),
            ],
            CustomerModel::PHONE => 'nullable|string|max:20',
            CustomerModel::NOTES => 'nullable|string|max:1000',
            CustomerModel::ADDRESS => 'nullable|string|max:500',
            CustomerModel::DELIVERY_REFERENCE => 'nullable|string|max:500',
            CustomerModel::ALLOW_CREDIT => 'sometimes|boolean',
        ];
    }
}
