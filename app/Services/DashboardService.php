<?php

namespace App\Services;

use App\Enums\ClientLeadStatusEnum;
use App\Models\BusinessConfigModel;
use App\Models\ClientLeadModel;
use App\Models\ErrorReporting;
use App\Models\PersonalAccessToken;
use Carbon\Carbon;

class DashboardService
{
    public function __construct(private readonly SubscriptionStatisticsService $statisticsService) {}

    /** Ventana usada para "suscripciones por vencer" y "sin actividad reciente". */
    const EXPIRING_SOON_DAYS = 7;

    const STALE_DAYS = 14;

    const RECENT_ERRORS_LIMIT = 8;

    const STALE_TENANTS_LIMIT = 8;

    public function summary(): array
    {
        return [
            'tenants' => $this->tenantsCounts(),
            'active_users_now' => $this->activeUsersNow(),
            'mrr' => $this->statisticsService->totalMonthlyRevenue(),
            'errors_last_24h' => $this->errorsLast24h(),
            'recent_errors' => $this->recentErrors(),
            'expiring_subscriptions' => $this->expiringSubscriptions(),
            'stale_tenants' => $this->staleTenants(),
            'client_leads' => $this->clientLeadsByStatus(),
            'feature_adoption' => $this->featureAdoption(),
        ];
    }

    private function tenantsCounts(): array
    {
        $base = BusinessConfigModel::withoutTrashed();

        return [
            'active' => (clone $base)->where(BusinessConfigModel::ACTIVO, true)->where(BusinessConfigModel::IS_DEMO, false)->count(),
            'demo' => (clone $base)->where(BusinessConfigModel::IS_DEMO, true)->count(),
            'inactive' => (clone $base)->where(BusinessConfigModel::ACTIVO, false)->count(),
        ];
    }

    /** Usuarios con una sesión usada en los últimos N minutos (ver PersonalAccessToken::activeWindowMinutes()), across todos los tenants. */
    private function activeUsersNow(): int
    {
        return PersonalAccessToken::where(
            PersonalAccessToken::LAST_USED_AT,
            '>=',
            now()->subMinutes(PersonalAccessToken::activeWindowMinutes()),
        )->count();
    }

    private function errorsLast24h(): array
    {
        $since = now()->subDay();

        return [
            'total' => ErrorReporting::where('created_at', '>=', $since)->count(),
            'backend' => ErrorReporting::backend()->where('created_at', '>=', $since)->count(),
            'frontend' => ErrorReporting::frontend()->where('created_at', '>=', $since)->count(),
        ];
    }

    private function recentErrors(): array
    {
        return ErrorReporting::orderByDesc('created_at')
            ->limit(self::RECENT_ERRORS_LIMIT)
            ->get(['source', 'status_code', 'error_message', 'tenant_slug', 'created_at'])
            ->toArray();
    }

    /** Tenants activos o demo con suscripción venciendo en los próximos EXPIRING_SOON_DAYS días. */
    private function expiringSubscriptions(): array
    {
        return BusinessConfigModel::withoutTrashed()
            ->where(function ($q) {
                $q->where(BusinessConfigModel::ACTIVO, true)->orWhere(BusinessConfigModel::IS_DEMO, true);
            })
            ->whereBetween(BusinessConfigModel::SUBSCRIPTION_EXPIRES_AT, [
                Carbon::today(),
                Carbon::today()->addDays(self::EXPIRING_SOON_DAYS),
            ])
            ->orderBy(BusinessConfigModel::SUBSCRIPTION_EXPIRES_AT)
            ->get(['id', 'business_name', 'slug', 'subscription_plan', 'subscription_amount', 'subscription_expires_at'])
            ->map(fn (BusinessConfigModel $tenant) => [
                'id' => $tenant->id,
                'business_name' => $tenant->business_name,
                'slug' => $tenant->slug,
                'subscription_plan' => $tenant->subscription_plan,
                'subscription_amount' => $tenant->subscription_amount,
                'subscription_expires_at' => $tenant->subscription_expires_at?->toDateString(),
                'days_remaining' => $tenant->days_remaining,
            ])
            ->values()
            ->toArray();
    }

    /** Tenants activos/demo sin actividad (login/venta/sesión) en los últimos STALE_DAYS días. */
    private function staleTenants(): array
    {
        $cutoff = Carbon::today()->subDays(self::STALE_DAYS);

        return BusinessConfigModel::withoutTrashed()
            ->where(function ($q) {
                $q->where(BusinessConfigModel::ACTIVO, true)->orWhere(BusinessConfigModel::IS_DEMO, true);
            })
            ->select(['id', 'business_name', 'slug'])
            ->addSelect(BusinessConfigModel::lastActivitySelects())
            ->get()
            ->map(function (BusinessConfigModel $tenant) {
                $tenant->last_activity_at = BusinessConfigModel::combineLastActivity(
                    $tenant->last_login_activity_at,
                    $tenant->last_session_activity_at,
                );

                return $tenant;
            })
            ->filter(fn (BusinessConfigModel $tenant) => ! $tenant->last_activity_at || Carbon::parse($tenant->last_activity_at)->lt($cutoff))
            ->sortBy('last_activity_at')
            ->take(self::STALE_TENANTS_LIMIT)
            ->map(fn (BusinessConfigModel $tenant) => [
                'id' => $tenant->id,
                'business_name' => $tenant->business_name,
                'slug' => $tenant->slug,
                'last_activity_at' => $tenant->last_activity_at,
            ])
            ->values()
            ->toArray();
    }

    private function clientLeadsByStatus(): array
    {
        $counts = ClientLeadModel::selectRaw('status, count(*) as total')
            ->groupBy(ClientLeadModel::STATUS)
            ->pluck('total', 'status');

        return [
            'follow_up' => (int) ($counts[ClientLeadStatusEnum::FollowUp->value] ?? 0),
            'customer' => (int) ($counts[ClientLeadStatusEnum::Customer->value] ?? 0),
            'discarded' => (int) ($counts[ClientLeadStatusEnum::Discarded->value] ?? 0),
        ];
    }

    private function featureAdoption(): array
    {
        $base = BusinessConfigModel::withoutTrashed()->where(BusinessConfigModel::ACTIVO, true);

        return [
            'multi_branch' => (clone $base)->where(BusinessConfigModel::MULTI_BRANCH_ENABLED, true)->count(),
            'printer' => (clone $base)->where(BusinessConfigModel::PRINTER_ENABLED, true)->count(),
            'stock' => (clone $base)->where(BusinessConfigModel::STOCK_ENABLED, true)->count(),
            'customers' => (clone $base)->where(BusinessConfigModel::CUSTOMERS_ENABLED, true)->count(),
        ];
    }
}
