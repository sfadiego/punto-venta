<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Models\ProductModel;
use App\Models\StockMovementModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class StockMovementsService extends DataTable
{
    public function __construct(StockMovementModel $model)
    {
        parent::__construct($model);
    }

    public function tableHeaders(): array
    {
        return [
            'id' => '#',
            'type' => 'Tipo',
            'reason' => 'Razón',
            'quantity' => 'Cantidad',
            'created_at' => 'Fecha',
        ];
    }

    public function makeQuery(): Builder
    {
        /** @var ProductModel $product */
        $product = request()->route('product');

        $query = $this->model->newQuery()
            ->with('createdBy:id,nombre')
            ->where('product_id', $product->id);

        // ?variant_id=X filtra al kardex de esa variante; sin el parámetro se muestran
        // solo los movimientos a nivel producto (comportamiento actual sin variantes).
        $variantId = request()->query('variant_id');

        return $variantId ? $query->where('variant_id', $variantId) : $query->whereNull('variant_id');
    }

    // El historial siempre se lee más reciente primero — no tiene sentido de negocio
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
