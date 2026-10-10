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
}
