<?php

namespace App\Http\Requests;

use App\Enums\FeatureSpotlightEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TenantFeatureSpotlightUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'enabled_keys' => 'present|array',
            'enabled_keys.*' => ['string', Rule::enum(FeatureSpotlightEnum::class)],
        ];
    }
}
