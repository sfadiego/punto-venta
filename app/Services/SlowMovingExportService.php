<?php

namespace App\Services;

use Generator;

/** Reporte exportable de productos sin movimiento: el listado completo del filtro activo, sin paginar. */
class SlowMovingExportService
{
    public function __construct(private readonly SlowMovingProductsReport $report) {}

    /** @return string[] */
    public function headers(): array
    {
        return [
            'Código', 'Producto', 'Categoría', 'Fecha de ingreso', 'Último reabastecimiento', 'Última venta',
            'Días sin movimiento', 'Stock', 'Precio', 'Valor estancado', 'Vendido en 90 días',
        ];
    }

    /** @return Generator<int, array<int, string|int|float|null>> */
    public function rows(int $days, ?string $search, ?int $categoryId): Generator
    {
        // Orden por defecto del reporte: más días sin movimiento primero.
        $query = $this->report->applyOrder($this->report->query($days, $search, $categoryId), null, null);

        foreach ($query->cursor() as $product) {
            yield [
                $product->product_code,
                $product->nombre,
                $product->categoria,
                $this->date($product->entry_date),
                $this->date($product->last_restock_at),
                $this->date($product->last_sale_at) ?? 'Nunca',
                (int) $product->days_idle,
                (float) $product->stock,
                (float) $product->precio,
                (float) $product->inventory_value,
                (float) $product->sold_90d,
            ];
        }
    }

    private function date(mixed $value): ?string
    {
        return $value ? substr((string) $value, 0, 10) : null;
    }
}
