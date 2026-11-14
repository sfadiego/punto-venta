<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Models\CategoryModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class CategoryService extends DataTable
{
    public function __construct(CategoryModel $model)
    {
        parent::__construct($model);
    }

    public function tableHeaders(): array
    {
        return [
            'id' => '#',
            'nombre' => 'Nombre',
            'icon_name' => 'Ícono',
            'orden' => 'Orden',
        ];
    }

    public function makeQuery(): Builder
    {
        $query = $this->model->newQuery();

        $search = request()->query('search');
        if ($search) {
            $query->where(CategoryModel::NOMBRE, 'like', "%{$search}%");
        }

        return $query;
    }

    public function run(IndexData $data): JsonResponse
    {
        return parent::build($data);
    }
}
