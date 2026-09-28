<?php

namespace App\Services;

use App\Enums\OrderStatusEnum;
use App\Models\OrderModel;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class SalesReportExportService
{
    // Tope de filas para el PDF (DomPDF es pesado en CPU/memoria) — generoso a propósito: un
    // tenant real no genera 5,000 ventas cerradas en un solo día/semana/mes, así que esto
    // nunca debería afectar un reporte legítimo, solo evitar que un rango sin acotar (o un
    // tenant con historial enorme) tumbe el proceso generando un PDF gigante.
    private const MAX_ROWS = 5000;

    /**
     * Genera el PDF del reporte de ventas (órdenes cerradas) para el período indicado.
     */
    public function buildPdf(?int $sistemaId, ?string $date, ?string $week, ?string $month, bool $sellByWeight): string
    {
        $orders = $this->closedOrders($sistemaId, $date, $week, $month);
        $totalRevenue = $orders->sum(OrderModel::TOTAL);

        $pdf = Pdf::loadView('reports.sales-report', [
            'orders' => $orders,
            'totalRevenue' => $totalRevenue,
            'averageSale' => $orders->isNotEmpty() ? $totalRevenue / $orders->count() : 0,
            'periodLabel' => $this->periodLabel($date, $week, $month),
            'sellByWeight' => $sellByWeight,
        ])->setPaper('a4', 'portrait');

        return $pdf->output();
    }

    private function periodLabel(?string $date, ?string $week, ?string $month): string
    {
        if ($date) {
            return Carbon::parse($date)->translatedFormat('d \d\e F \d\e Y');
        }

        if ($week) {
            $start = Carbon::parse($week);

            return 'Semana del '.$start->translatedFormat('d M').' al '.$start->copy()->addDays(6)->translatedFormat('d M Y');
        }

        if ($month) {
            return Carbon::parse($month.'-01')->translatedFormat('F \d\e Y');
        }

        return 'Todas las ventas';
    }

    /** Cuenta las filas que el reporte incluiría, sin cargar relaciones — barato, para chequear MAX_ROWS antes de construir el PDF. */
    public function countClosedOrders(?int $sistemaId, ?string $date, ?string $week, ?string $month): int
    {
        return $this->closedOrdersQuery($sistemaId, $date, $week, $month)->count();
    }

    public function exceedsRowLimit(?int $sistemaId, ?string $date, ?string $week, ?string $month): bool
    {
        return $this->countClosedOrders($sistemaId, $date, $week, $month) > self::MAX_ROWS;
    }

    public function closedOrders(?int $sistemaId, ?string $date, ?string $week, ?string $month): Collection
    {
        return $this->closedOrdersQuery($sistemaId, $date, $week, $month)
            ->with(['paymentMethod:id,name', 'customer:id,name'])
            ->orderBy('created_at')
            ->get();
    }

    private function closedOrdersQuery(?int $sistemaId, ?string $date, ?string $week, ?string $month)
    {
        $query = OrderModel::query()
            ->where(OrderModel::ESTATUS_PEDIDO_ID, OrderStatusEnum::CLOSED->value);

        if ($sistemaId) {
            $query->where(OrderModel::SISTEMA_ID, $sistemaId);
        }

        $this->applyPeriod($query, 'created_at', $date, $week, $month);

        return $query;
    }

    private function applyPeriod($query, string $column, ?string $date, ?string $week, ?string $month): void
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
