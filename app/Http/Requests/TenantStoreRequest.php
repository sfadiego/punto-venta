<?php

namespace App\Http\Requests;

use App\Enums\BusinessTypeEnum;
use App\Enums\SubscriptionPlanEnum;
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
            // Sin unique: el tenant se está creando en este mismo request — parte de cero
            // usuarios, así que no hay nada contra qué comparar. usuario tampoco se usa para
            // login (eso es email), es único por tenant en el resto de los formularios que sí
            // tienen un tenant existente contra el cual scopear (ver UserStoreRequest,
            // TenantUserStoreRequest) — aquí simplemente no aplica.
            'admin_usuario' => 'required|string|max:80',
            'admin_password' => 'required|string|min:6',
            BusinessConfigModel::TIPO_NEGOCIO => ['nullable', Rule::enum(BusinessTypeEnum::class)],
            BusinessConfigModel::IS_DEMO => 'nullable|boolean',
            // Suscripción inicial: sin estos campos se conserva el comportamiento previo (mensual de prueba).
            'plan' => ['nullable', Rule::enum(SubscriptionPlanEnum::class)],
            'is_trial' => 'nullable|boolean',
            'starts_at' => 'nullable|date',
            // 250 para dejar margen al prefijo «Periodo de prueba — » dentro de subscriptions.notes (300).
            'notes' => 'nullable|string|max:250',
            'amount' => [Rule::requiredIf(fn () => $this->has('is_trial') && ! $this->boolean('is_trial')), 'nullable', 'numeric', 'min:0'],
        ];
    }
}
