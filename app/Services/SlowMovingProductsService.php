<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Models\ProductModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

/** Listado paginado de productos sin movimiento — la medición vive en SlowMovingProductsReport. */
class SlowMovingProductsService extends DataTable
{
    public function __construct(ProductModel $model, private readonly SlowMovingProductsReport $report)
    {
        parent::__construct($model);
    }

    public function tableHeaders(): array
    {
        return [
            'product_code' => 'Código',
            'nombre' => 'Producto',
            'categoria' => 'Categoría',
            'entry_date' => 'Fecha de ingreso',
            'last_restock_at' => 'Último reabastecimiento',
            'last_sale_at' => 'Última venta',
            'days_idle' => 'Días sin movimiento',
            'stock' => 'Stock',
            'precio' => 'Precio',
            'inventory_value' => 'Valor estancado',
            'sold_90d' => 'Vendido en 90 días',
        ];
    }

    public function makeQuery(): Builder
    {
        $categoryId = request()->query('categoria_id');

        return $this->report->query(
            request()->integer('days', SlowMovingProductsReport::DEFAULT_DAYS),
            request()->query('search'),
            $categoryId ? (int) $categoryId : null,
        );
    }

    protected function orderQuery(string $orderParam, string $order): Builder
    {
        return $this->report->applyOrder($this->queryBuilder, $orderParam, $order);
    }

    public function run(IndexData $data): JsonResponse
    {
        return parent::build($data);
    }
}
