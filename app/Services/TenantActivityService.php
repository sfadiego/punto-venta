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
}
