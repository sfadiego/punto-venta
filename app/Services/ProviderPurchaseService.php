<?php

namespace App\Services;

use App\Models\ProviderPurchaseModel;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class ProviderPurchaseService
{
    public function purchasesByProvider(int $providerId, ?string $date, ?string $month = null, ?string $week = null): Collection
    {
        $query = ProviderPurchaseModel::query()
            ->where(ProviderPurchaseModel::PROVIDER_ID, $providerId);

        $this->applyPeriod($query, 'created_at', $date, $month, $week);

        return $query->orderByDesc('created_at')->get();
    }

    /**
     * Aplica el filtro de fecha puntual, semana (lunes YYYY-MM-DD) o mes (YYYY-MM) sobre la columna dada.
     */
    private function applyPeriod(Builder $query, string $column, ?string $date, ?string $month, ?string $week = null): void
    {
        if ($date) {
            $query->whereDate($column, $date);
        } elseif ($week) {
            $query->whereBetween($column, [
                Carbon::parse($week)->startOfDay(),
                Carbon::parse($week)->addDays(6)->endOfDay(),
            ]);
        } elseif ($month) {
            [$year, $monthNumber] = explode('-', $month);
            $query->whereYear($column, (int) $year)->whereMonth($column, (int) $monthNumber);
        }
    }
}
