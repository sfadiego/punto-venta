<?php

namespace App\Http\Requests\Concerns;

use App\Enums\SubscriptionPlanEnum;
use App\Models\BusinessConfigModel;
use Closure;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

trait ValidatesTenantSubscription
{
    /**
     * Reglas de la suscripción inicial de un tenant (alta, o conversión de un negocio de pruebas en cliente).
     * Cada request decide cuándo son obligatorios los campos y cuándo el monto.
     *
     * @return array<string, array<int, mixed>|string>
     */
    protected function subscriptionStartRules(Closure $isRequired, Closure $isAmountRequired): array
    {
        return [
            'plan' => [Rule::requiredIf($isRequired), 'nullable', Rule::enum(SubscriptionPlanEnum::class)],
            'is_trial' => [Rule::requiredIf($isRequired), 'nullable', 'boolean'],
            'starts_at' => [Rule::requiredIf($isRequired), 'nullable', 'date'],
            // 250 para dejar margen al prefijo «Periodo de prueba — » dentro de subscriptions.notes (300).
            'notes' => 'nullable|string|max:250',
            'amount' => [Rule::requiredIf($isAmountRequired), 'nullable', 'numeric', 'min:0'],
        ];
    }

    /** Un tenant es de pruebas internas o prospecto demo, no ambos. */
    protected function assertNotTestAndDemo(Validator $validator): void
    {
        if ($this->boolean(BusinessConfigModel::IS_TEST) && $this->boolean(BusinessConfigModel::IS_DEMO)) {
            $validator->errors()->add(BusinessConfigModel::IS_TEST, __('Un negocio de pruebas no puede ser también un cliente demo.'));
        }
    }
}
