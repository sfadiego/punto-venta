<?php

namespace App\Http\Requests;

use App\Enums\ClientLeadStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClientLeadUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(ClientLeadStatusEnum::class)],
            'notes' => 'nullable|string|max:2000',
        ];
    }
}
