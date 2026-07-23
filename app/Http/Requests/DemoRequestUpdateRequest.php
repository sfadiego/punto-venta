<?php

namespace App\Http\Requests;

use App\Enums\DemoRequestStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DemoRequestUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(DemoRequestStatusEnum::class)],
            'notes' => 'nullable|string|max:2000',
        ];
    }
}
