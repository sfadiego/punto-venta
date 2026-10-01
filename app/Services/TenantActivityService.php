<?php

namespace App\Services;

use App\Enums\ActivityTypeEnum;
use App\Models\TenantActivityLogModel;
use Illuminate\Support\Carbon;

class TenantActivityService
{
    public function log(int $tenantId, ActivityTypeEnum $type): void
    {
        TenantActivityLogModel::create([
            TenantActivityLogModel::TENANT_ID => $tenantId,
            TenantActivityLogModel::TYPE => $type->value,
            TenantActivityLogModel::CREATED_AT => now(),
        ]);
    }

    /**
     * @return array{daily: array<int, array{date: string, count: int}>, hourly: array<int, array{hour: int, count: int}>}
     */
    public function report(int $tenantId, int $days = 30): array
    {
        $from = now()->subDays($days - 1)->startOfDay();

        $rows = TenantActivityLogModel::query()
            ->where(TenantActivityLogModel::TENANT_ID, $tenantId)
            ->where(TenantActivityLogModel::CREATED_AT, '>=', $from)
            ->get([TenantActivityLogModel::CREATED_AT]);

        $countsByDate = [];
        $countsByHour = [];

        foreach ($rows as $row) {
            $createdAt = Carbon::parse($row->created_at);
            $date = $createdAt->toDateString();
            $hour = (int) $createdAt->format('G');

            $countsByDate[$date] = ($countsByDate[$date] ?? 0) + 1;
            $countsByHour[$hour] = ($countsByHour[$hour] ?? 0) + 1;
        }

        $daily = [];
        $cursor = $from->copy();
        $today = now()->startOfDay();
        while ($cursor->lte($today)) {
            $date = $cursor->toDateString();
            $daily[] = ['date' => $date, 'count' => $countsByDate[$date] ?? 0];
            $cursor->addDay();
        }

        $hourly = [];
        for ($hour = 0; $hour < 24; $hour++) {
            $hourly[] = ['hour' => $hour, 'count' => $countsByHour[$hour] ?? 0];
        }

        return ['daily' => $daily, 'hourly' => $hourly];
    }

    /**
     * Horario de mayor uso a nivel sistema (todos los tenants) — a diferencia de report(), que
     * es por tenant, aquí se agrupa por hora en PHP en vez de una función de fecha específica
     * del motor (HOUR() de MySQL no existe en SQLite, usado por los tests) — solo se trae la
     * columna created_at, sin cargar el modelo completo por fila.
     *
     * @return array{hourly: array<int, array{hour: int, count: int}>, peak_hour: int|null, peak_count: int}
     */
    public function systemHourlyReport(int $days = 30): array
    {
        $from = now()->subDays($days - 1)->startOfDay();

        $countsByHour = [];
        TenantActivityLogModel::query()
            ->where(TenantActivityLogModel::CREATED_AT, '>=', $from)
            ->pluck(TenantActivityLogModel::CREATED_AT)
            ->each(function ($createdAt) use (&$countsByHour) {
                $hour = (int) Carbon::parse($createdAt)->format('G');
                $countsByHour[$hour] = ($countsByHour[$hour] ?? 0) + 1;
            });

        $hourly = [];
        for ($hour = 0; $hour < 24; $hour++) {
            $hourly[] = ['hour' => $hour, 'count' => $countsByHour[$hour] ?? 0];
        }

        $peak = collect($hourly)->sortByDesc('count')->first();

        return [
            'hourly' => $hourly,
            'peak_hour' => $peak['count'] > 0 ? $peak['hour'] : null,
            'peak_count' => $peak['count'],
        ];
    }
}
