<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Models\AddonModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class AddonService extends DataTable
{
    public function __construct(AddonModel $model)
    {
        parent::__construct($model);
    }

    public function tableHeaders(): array
    {
        return [
            'id' => '#',
            'name' => 'Nombre',
            'price' => 'Precio',
            'is_active' => 'Activo',
        ];
    }

    public function makeQuery(): Builder
    {
        // products_count alimenta el "en N productos" del catálogo (ver AddonsManagerModal).
        $query = $this->model->newQuery()->withCount('products');

        $search = request()->query('search');
        if ($search) {
            $query->where(AddonModel::NAME, 'like', "%{$search}%");
        }

        return $query;
    }

    public function run(IndexData $data): JsonResponse
    {
        return parent::build($data);
    }
}
