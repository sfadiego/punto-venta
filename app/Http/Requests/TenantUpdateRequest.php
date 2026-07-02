<?php

namespace App\Http\Requests;

use App\Enums\BusinessTypeEnum;
use App\Models\BusinessConfigModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TenantUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->route('tenant')?->id;

        return [
            BusinessConfigModel::SLUG => ['required', 'string', 'alpha_dash', Rule::unique('business_config', 'slug')->ignore($tenantId)],
            BusinessConfigModel::ACTIVO => 'boolean',
            BusinessConfigModel::BUSINESS_NAME => 'required|string|max:100',
            BusinessConfigModel::PRIMARY_COLOR => 'required|string|max:20',
            BusinessConfigModel::SIDEBAR_COLOR => 'required|string|max:20',
            BusinessConfigModel::FONT_COLOR => 'required|string|max:20',
            BusinessConfigModel::LABEL_COLOR => 'required|string|max:20',
            BusinessConfigModel::LOGO_ICON => 'nullable|string|max:50',
            BusinessConfigModel::TIPO_NEGOCIO => ['nullable', Rule::enum(BusinessTypeEnum::class)],
        ];
    }
}
