<?php

namespace App\Http\Requests;

use App\Enums\BusinessTypeEnum;
use App\Http\Requests\Concerns\ValidatesTenantSubscription;
use App\Models\BusinessConfigModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class TenantUpdateRequest extends FormRequest
{
    use ValidatesTenantSubscription;

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
            BusinessConfigModel::IS_DEMO => 'boolean',
            BusinessConfigModel::IS_TEST => 'boolean',
            BusinessConfigModel::BUSINESS_NAME => 'required|string|max:100',
            BusinessConfigModel::PRIMARY_COLOR => 'required|string|max:20',
            BusinessConfigModel::SIDEBAR_COLOR => 'required|string|max:20',
            BusinessConfigModel::FONT_COLOR => 'required|string|max:20',
            BusinessConfigModel::LABEL_COLOR => 'required|string|max:20',
            BusinessConfigModel::LOGO_ICON => 'nullable|string|max:50',
            BusinessConfigModel::TIPO_NEGOCIO => ['nullable', Rule::enum(BusinessTypeEnum::class)],
            BusinessConfigModel::PRINTER_ENABLED => 'boolean',
            BusinessConfigModel::BLUETOOTH_PRINTING_ENABLED => 'boolean',
            BusinessConfigModel::PURCHASES_ENABLED => 'boolean',
            BusinessConfigModel::EMPLOYEES_ENABLED => 'boolean',
            BusinessConfigModel::STOCK_ENABLED => 'boolean',
            BusinessConfigModel::MAX_USERS => 'nullable|integer|min:1|max:999',
            BusinessConfigModel::SUBSCRIPTION_AMOUNT => 'nullable|numeric|min:0',
            // Al convertir un negocio de pruebas en cliente se registra su suscripción inicial (mismas reglas del alta).
            ...$this->subscriptionStartRules(
                $this->needsInitialSubscription(...),
                fn () => $this->needsInitialSubscription() && ! $this->boolean('is_trial'),
            ),
        ];
    }

    /**
     * Un negocio de pruebas que este request convierte en cliente y que no tiene una suscripción vigente:
     * un cliente real nunca queda sin ella. Si ya tiene una vigente se conserva, sin registrar otra.
     */
    public function needsInitialSubscription(): bool
    {
        $tenant = $this->route('tenant');

        return $tenant?->is_test === true
            && $this->has(BusinessConfigModel::IS_TEST)
            && ! $this->boolean(BusinessConfigModel::IS_TEST)
            && ! $tenant->hasCurrentSubscription();
    }

    /**
     * Un tenant desactivado no se edita hasta reactivarlo (PATCH tenant/{tenant}/toggle).
     * Un tenant es de prueba interna o prospecto demo, no ambos.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->route('tenant')?->activo === false) {
                    $validator->errors()->add('tenant', __('Reactiva el negocio para poder editar su información.'));
                }
            },
            fn (Validator $validator) => $this->assertNotTestAndDemo($validator),
        ];
    }
}
