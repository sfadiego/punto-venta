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
        $query = $this->model->newQuery()->with(['category', 'variants']);

        $nombre = request()->query('nombre');
        $categoriaId = request()->query('categoria_id');

        if ($nombre) {
            $query->where(function (Builder $query) use ($nombre) {
                // product_code es match exacto (viene de un lector de código de barras, no
                // texto libre) — un LIKE parcial aquí generaría falsos positivos entre
                // códigos que comparten substring.
                $query->where('nombre', 'like', "%{$nombre}%")
                    ->orWhere('product_code', $nombre)
                    ->orWhereHas('category', function ($query) use ($nombre) {
                        $query->where('nombre', 'like', "%{$nombre}%");
                    });
            });
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
