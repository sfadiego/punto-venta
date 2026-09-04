<?php

namespace App\Http\Requests;

use App\Enums\BusinessNicheEnum;
use App\Enums\ClientLeadStatusEnum;
use App\Rules\PlausiblePhoneRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClientLeadStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'business_name' => 'required|string|max:150',
            'email' => 'required|email|max:150',
            'phone' => ['required', 'string', 'max:13', 'regex:/^\+?[0-9]{10,12}$/', new PlausiblePhoneRule],
            'business_niche' => ['required', Rule::enum(BusinessNicheEnum::class)],
            'status' => ['nullable', Rule::enum(ClientLeadStatusEnum::class)],
            'notes' => 'nullable|string|max:2000',
        ];
    }
}
