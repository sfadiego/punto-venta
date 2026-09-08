<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Models\StockMovementModel;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

/**
 * Kardex global del tenant (página de Inventario) — a diferencia de StockMovementsService
 * (kardex por producto, usado desde Productos), no exige ningún producto de la ruta: lista
 * todos los movimientos de stock_movements del tenant, con filtros opcionales por
 * querystring. El scope de tenant lo aplica HasTenant en StockMovementModel.
 */
class KardexService extends DataTable
{
    public function __construct(StockMovementModel $model)
    {
        parent::__construct($model);
    }

    public function tableHeaders(): array
    {
        return [
            'id' => '#',
            'product_id' => 'Producto',
            'variant_id' => 'Variante',
            'type' => 'Tipo',
            'reason' => 'Razón',
            'quantity' => 'Cantidad',
            'stock_before' => 'Stock antes',
            'stock_after' => 'Stock después',
            'created_by' => 'Usuario',
            'created_at' => 'Fecha',
        ];
    }

    public function makeQuery(): Builder
    {
        $query = $this->model->newQuery()
            ->with(['product:id,nombre', 'variant:id,nombre', 'createdBy:id,nombre']);

        $productId = request()->query('product_id');
        if ($productId) {
            $query->where(StockMovementModel::PRODUCT_ID, $productId);
        }

        $variantId = request()->query('variant_id');
        if ($variantId) {
            $query->where(StockMovementModel::VARIANT_ID, $variantId);
        }

        $type = request()->query('type');
        if ($type) {
            $query->where(StockMovementModel::TYPE, $type);
        }

        $reason = request()->query('reason');
        if ($reason) {
            $query->where(StockMovementModel::REASON, $reason);
        }

        $fechaDesde = request()->query('fecha_desde');
        $fechaHasta = request()->query('fecha_hasta');
        if ($fechaDesde && $fechaHasta) {
            $query->whereBetween('created_at', [
                Carbon::parse($fechaDesde)->startOfDay(),
                Carbon::parse($fechaHasta)->endOfDay(),
            ]);
        } elseif ($fechaDesde) {
            $query->whereDate('created_at', $fechaDesde);
        }

        return $query;
    }

    // El kardex siempre se lee más reciente primero — no tiene sentido de negocio
    // dejarlo reordenable como un listado normal.
    protected function orderQuery(string $orderParam, string $order): Builder
    {
        return $this->queryBuilder->orderBy('created_at', 'desc');
    }

    public function run(IndexData $data): JsonResponse
    {
        return parent::build($data);
    }
}
