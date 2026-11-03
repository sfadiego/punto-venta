<?php

namespace App\Services;

use App\Enums\SubscriptionPlanEnum;
use App\Models\BusinessConfigModel;
use App\Models\SubscriptionModel;
use Carbon\Carbon;

/**
 * Registra una suscripción en el historial y deja business_config sincronizado con ella.
 * Lo usan el alta de cliente y el registro de pagos del SuperAdmin.
 */
class SubscriptionService
{
    public function start(BusinessConfigModel $tenant, SubscriptionPlanEnum $plan, Carbon $startsAt, ?float $amount, ?string $notes): SubscriptionModel
    {
        $log = SubscriptionModel::createFromPlan(
            tenantId: $tenant->id,
            plan: $plan,
            startsAt: $startsAt,
            amount: $amount,
            notes: $notes,
        );

        $tenant->update([
            BusinessConfigModel::SUBSCRIPTION_PLAN => $plan->value,
            BusinessConfigModel::SUBSCRIPTION_EXPIRES_AT => $log->expires_at,
            BusinessConfigModel::MAX_USERS => $plan->maxUsers(),
        ]);

        return $log;
    }

    /**
     * Suscripción inicial de un tenant (alta, o conversión de un negocio de pruebas en cliente).
     * Una prueba se registra con monto 0 y la nota «Periodo de prueba»; si no, con el monto cobrado.
     */
    public function startInitial(BusinessConfigModel $tenant, SubscriptionPlanEnum $plan, Carbon $startsAt, bool $isTrial, ?float $amount, ?string $notes): SubscriptionModel
    {
        $base = $isTrial ? SubscriptionModel::TRIAL_NOTES : SubscriptionModel::INITIAL_NOTES;
        $notes = trim((string) $notes);

        return $this->start(
            tenant: $tenant,
            plan: $plan,
            startsAt: $startsAt,
            amount: $isTrial ? 0 : $amount,
            notes: $notes === '' ? $base : "{$base} — {$notes}",
        );
    }

    /**
     * Pago registrado por el SuperAdmin. Un pago real (monto > 0) convierte al prospecto demo en cliente:
     * se desmarca is_demo para que cuente en "Activos" e ingresos y recupere los días de gracia.
     */
    public function registerPayment(BusinessConfigModel $tenant, SubscriptionPlanEnum $plan, Carbon $startsAt, ?float $amount, ?string $notes): SubscriptionModel
    {
        $log = $this->start($tenant, $plan, $startsAt, $amount, $notes);

        if ($tenant->is_demo && $amount > 0) {
            $tenant->update([BusinessConfigModel::IS_DEMO => false]);
        }

        return $log;
    }
}
