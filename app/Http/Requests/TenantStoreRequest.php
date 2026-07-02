<?php

namespace App\Http\Requests;

use App\Enums\BusinessTypeEnum;
use App\Models\BusinessConfigModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TenantStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            BusinessConfigModel::SLUG => 'required|string|alpha_dash|unique:business_config,slug',
            BusinessConfigModel::BUSINESS_NAME => 'required|string|max:100',
            BusinessConfigModel::PRIMARY_COLOR => 'required|string|max:20',
            BusinessConfigModel::SIDEBAR_COLOR => 'required|string|max:20',
            BusinessConfigModel::FONT_COLOR => 'required|string|max:20',
            BusinessConfigModel::LABEL_COLOR => 'required|string|max:20',
            'admin_nombre' => 'required|string|max:100',
            'admin_apellido' => 'required|string|max:100',
            'admin_email' => 'required|email|unique:users,email',
            'admin_usuario' => 'required|string|unique:users,usuario',
            'admin_password' => 'required|string|min:6',
            BusinessConfigModel::TIPO_NEGOCIO => ['nullable', Rule::enum(BusinessTypeEnum::class)],
        ];
    }
}
