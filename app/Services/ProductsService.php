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
        $query = $this->model->newQuery()->with(['category', 'variants', 'branches']);

        $nombre = request()->query('nombre');
        $categoriaId = request()->query('categoria_id');
        $lowStock = request()->query('low_stock');
        $branchId = request()->query('branch_id');

        // Un producto sin sucursales asignadas en el pivote está disponible en todas — el
        // filtro solo excluye productos que SÍ tienen sucursales asignadas y esta no está
        // entre ellas. Usado por el catálogo de venta (TakeOrder/QuickSale); la página de
        // administración de productos no manda branch_id y sigue viendo el catálogo completo.
        if ($branchId) {
            $query->where(function (Builder $query) use ($branchId) {
                $query->doesntHave('branches')
                    ->orWhereHas('branches', fn (Builder $q) => $q->where('branches.id', (int) $branchId));
            });
        }

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

        // Mismo criterio que ProductModel::hasLowStock()/ProductVariantModel::hasLowStock()
        // (espejo en frontend: isProductRowLowStock()): sin min_stock configurado se asume 0.
        // Un producto con variantes activas lleva el stock por variante (product.stock queda
        // null en ese caso — ver ProductModel::updateProduct()), así que hay que evaluar el
        // mínimo ahí en vez del nivel producto; si no tiene variantes, se evalúa a nivel producto.
        if ($lowStock) {
            $query->where('manage_stock', true)
                ->where(function (Builder $query) {
                    $query->where(function (Builder $query) {
                        $query->whereNotNull('stock')
                            ->where(function (Builder $query) {
                                $query->whereColumn('stock', '<=', 'min_stock')
                                    ->orWhere(function (Builder $query) {
                                        $query->whereNull('min_stock')->where('stock', '<=', 0);
                                    });
                            });
                    })->orWhereHas('variants', function (Builder $query) {
                        $query->where('activo', true)
                            ->whereNotNull('stock')
                            ->where(function (Builder $query) {
                                $query->whereColumn('stock', '<=', 'min_stock')
                                    ->orWhere(function (Builder $query) {
                                        $query->whereNull('min_stock')->where('stock', '<=', 0);
                                    });
                            });
                    });
                });
        }

        return $query;
    }

    public function run(IndexData $data): JsonResponse
    {
        return parent::build($data);
    }
}
