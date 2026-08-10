<?php

namespace App\Services;

use App\Enums\SubscriptionPlanEnum;
use App\Models\BusinessConfigModel;

class SubscriptionStatisticsService
{
    /**
     * Ingreso mensual total: suma de subscription_amount de los tenants activos,
     * no demo, con monto de suscripción registrado y plan distinto a lifetime.
     */
    public function totalMonthlyRevenue(): float
    {
        return (float) BusinessConfigModel::withoutTrashed()
            ->where(BusinessConfigModel::ACTIVO, true)
            ->where(BusinessConfigModel::IS_DEMO, false)
            ->where(BusinessConfigModel::SUBSCRIPTION_AMOUNT, '>', 0)
            ->where(BusinessConfigModel::SUBSCRIPTION_PLAN, '!=', SubscriptionPlanEnum::Lifetime->value)
            ->sum(BusinessConfigModel::SUBSCRIPTION_AMOUNT);
    }
}
