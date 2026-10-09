<?php

namespace App\Services;

use App\Models\BusinessConfigModel;
use Carbon\Carbon;

/**
 * Datos de la sección "Productos sin movimiento" del reporte de ventas (PDF): la versión detallada
 * del reporte — la tabla de Estadísticas es la compacta. Solo aplica a retail con inventario
 * activo; en cualquier otro negocio devuelve null y el reporte no lleva la sección. Es una foto de
 * hoy, no del periodo del reporte (el stock actual no tiene historial por fecha).
 */
class SlowMovingSectionBuilder
{
    // Productos listados en el PDF — el resto se resume como "y N más" (el detalle completo
    // sigue disponible, ordenable y filtrable, en Estadísticas).
    public const MAX_ROWS = 100;

    public function __construct(private readonly SlowMovingProductsReport $report) {}

    /** @return array<string, mixed>|null */
    public function build(): ?array
    {
        $config = BusinessConfigModel::find(app('tenant_id'));
        $isRetail = $config?->tipo_negocio?->features()['is_retail'] ?? false;

        if (! $isRetail || ! $config->stock_enabled) {
            return null;
        }

        $days = SlowMovingProductsReport::DEFAULT_DAYS;
        $summary = $this->report->summary($days);
        $products = $this->report
            ->applyOrder($this->report->query($days), 'days_idle', 'desc')
            ->limit(self::MAX_ROWS)
            ->get();

        return [
            'asOf' => Carbon::today()->translatedFormat('d \d\e F \d\e Y'),
            'days' => $days,
            'summary' => $summary,
            'products' => $products,
            'hiddenCount' => max($summary['stale_count'] - self::MAX_ROWS, 0),
            'listedValue' => round((float) $products->sum('inventory_value'), 2),
        ];
    }
}
