<?php

namespace App\Http\Requests;

use App\Enums\AppThemeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AppSettingUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'logo_upload_enabled' => 'sometimes|boolean',
            'payment_info' => 'sometimes|array',
            'payment_info.bank' => 'required_with:payment_info|string|max:100',
            'payment_info.account' => 'required_with:payment_info|string|max:30',
            'payment_info.holder' => 'required_with:payment_info|string|max:150',
            'payment_info.concept' => 'nullable|string|max:150',
            'theme' => ['sometimes', Rule::in(array_column(AppThemeEnum::cases(), 'value'))],
        ];
    }
}
