<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Models\CategoryModel;
use App\Models\ProductModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Response;

class MenuService extends DataTable
{
    public function __construct(CategoryModel $model)
    {
        parent::__construct($model);
    }

    public function tableHeaders(): array
    {
        return [];
    }

    public function makeQuery(): Builder
    {
        return $this->model->withCount([
            'products as active_products_count' => fn ($q) => $q->where(ProductModel::ACTIVO, true),
        ])->having('active_products_count', '>', 0);
    }

    public function run(IndexData $data): JsonResponse
    {
        $this->queryBuilder = $this->makeQuery();
        $this->orderQuery('orden', 'asc');

        $perPage = min($data->perPage ?? 4, 100);
        $paginator = $this->queryBuilder->paginate($perPage, ['*'], 'page', $data->page);

        $productsMap = ProductModel::with('picture')
            ->where(ProductModel::ACTIVO, true)
            ->whereIn('categoria_id', $paginator->pluck('id'))
            ->get()
            ->groupBy('categoria_id');

        $mapped = $paginator->getCollection()->map(fn ($c) => [
            'id' => $c->id,
            'nombre' => $c->nombre,
            'icon' => $c->icon_name,
            'products' => ($productsMap[$c->id] ?? collect())->map(fn ($p) => [
                'id' => $p->id,
                'nombre' => $p->nombre,
                'descripcion' => $p->descripcion,
                'precio' => $p->precio,
                'unidad_medida' => $p->unidad_medida?->value,
                'image_url' => $p->picture?->url ? "/api/files/{$p->picture->url}" : null,
            ])->values(),
        ]);

        return Response::successDataTable(
            new LengthAwarePaginator(
                $mapped,
                $paginator->total(),
                $paginator->perPage(),
                $paginator->currentPage()
            ),
            $this->tableHeaders()
        );
    }
}
