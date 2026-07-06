<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Models\ProductModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class ProductsService extends DataTable
{
    public function __construct(ProductModel $model)
    {
        parent::__construct($model);
    }

    public function tableHeaders(): array
    {
        return [
            'id' => '#',
            'nombre' => 'Nombre',
            'precio' => 'Precio',
            'descripcion' => 'Descripcion',
            'activo' => 'Activo',
            'actions' => '#',
        ];
    }

    public function makeQuery(): Builder
    {
        $query = $this->model->newQuery()->with(['category']);

        $nombre = request()->query('nombre');
        $categoriaId = request()->query('categoria_id');

        if ($nombre) {
            $query->where('nombre', 'like', "%{$nombre}%");
        }

        if ($categoriaId) {
            $query->where('categoria_id', (int) $categoriaId);
        }

        return $query;
    }

    public function run(IndexData $data): JsonResponse
    {
        return parent::build($data);
    }
}
