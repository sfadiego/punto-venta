<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Enums\StockMovementReasonEnum;
use App\Enums\UnidadMedidaEnum;
use App\Exceptions\InsufficientStockException;
use App\Http\Requests\ProductStockAdjustmentRequest;
use App\Http\Requests\ProductStoreRequest;
use App\Http\Requests\ProductUpdateRequest;
use App\Models\ProductImageModel;
use App\Models\ProductModel;
use App\Services\ProductsService;
use App\Services\ProductVariantService;
use App\Services\StockMovementsService;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class ProductController extends Controller
{
    public function index(IndexData $data, ProductsService $service): JsonResponse
    {
        return $service->run($data);
    }

    public function show(ProductModel $product): JsonResponse
    {
        return Response::success($product->load('variants'));
    }

    public function store(ProductStoreRequest $param, StockService $stockService): JsonResponse
    {
        $manageStock = (bool) ($param->manage_stock ?? false);

        // si el usuario no captura un código, se genera uno a partir del nombre para
        // que el producto sea buscable con el lector desde su creación.
        $productCode = $param->product_code ?: ProductModel::generateProductCode($param->nombre);

        $product = ProductModel::create([
            ProductModel::NOMBRE => $param->nombre,
            ProductModel::PRECIO => $param->precio,
            ProductModel::DESCRIPCION => $param->descripcion ?? '',
            ProductModel::CATEGORIA_ID => $param->categoria_id,
            ProductModel::FOTO_ID => $param?->picture_id ?? null,
            ProductModel::UNIDAD_MEDIDA => $param->unidad_medida ?? UnidadMedidaEnum::Unidad->value,
            ProductModel::MANAGE_STOCK => $manageStock,
            // sin cantidad indicada: arranca en 0 (la carga real se aplica abajo como
            // movimiento) y el mínimo por defecto es 2 si no se especifica uno.
            ProductModel::STOCK => $manageStock ? 0 : null,
            ProductModel::MIN_STOCK => $manageStock ? ($param->min_stock ?? ProductModel::MIN_STOCK_DEFAULT) : null,
            ProductModel::PRODUCT_CODE => $productCode,
            ProductModel::ICON_NAME => $param->icon_name ?? null,
            ProductModel::ICON_SOURCE => $param->icon_source ?? null,
        ]);

        // la existencia inicial se registra como movimiento (no como valor directo
        // del INSERT) para que quede auditada en el kardex desde el día uno.
        $initialStock = (float) ($param->stock ?? 0);
        if ($manageStock && $initialStock > 0) {
            $stockService->adjust(
                productId: $product->id,
                delta: $initialStock,
                note: 'Carga inicial de stock',
                reason: StockMovementReasonEnum::InitialStock,
            );
        }

        return Response::success($product->refresh());
    }

    public function update(
        ProductModel $product,
        ProductUpdateRequest $param,
        StockService $stockService,
        ProductVariantService $variantService,
    ): JsonResponse {
        $wasManagingStock = $product->manage_stock;

        $updated = $product->updateProduct(
            nombre: $param->has('nombre') ? $param->nombre : null,
            precio: $param->has('precio') ? $param->precio : null,
            descripcion: $param->has('descripcion') ? ($param->descripcion !== null ? $param->descripcion : '') : null,
            categoriaId: $param->has('categoria_id') ? $param->categoria_id : null,
            pictureId: $param->has('picture_id') ? $param->picture_id : null,
            active: $param->has('activo') ? (bool) $param->activo : null,
            unidadMedida: $param->has('unidad_medida') ? $param->unidad_medida : null,
            manageStock: $param->has('manage_stock') ? (bool) $param->manage_stock : null,
            minStock: $param->has('min_stock') ? $param->min_stock : null,
            productCode: $param->has('product_code') ? ($param->product_code ?? '') : null,
            iconName: $param->has('icon_name') ? ($param->icon_name ?? '') : null,
            iconSource: $param->has('icon_source') ? $param->icon_source : null,
        );

        // Activación en caliente de manage_stock (antes false, ahora true):
        if (! $wasManagingStock && $updated->manage_stock) {
            $hasActiveVariants = $updated->variants()->where('activo', true)->exists();

            if ($hasActiveVariants) {
                // El stock vive por variante — inicializa en 0 las que se crearon antes de
                // esta activación (ver ProductVariantService::backfillStockOnActivation()).
                $variantService->backfillStockOnActivation($updated);
            } else {
                // Igual que al crear el producto, se puede capturar un stock inicial porque
                // no hay historial que proteger todavía. updateProduct() ya dejó stock en 0
                // por default — se carga como movimiento auditado en vez de reescribir la
                // columna directo.
                $initialStock = (float) ($param->stock ?? 0);
                if ($initialStock > 0) {
                    $updated = $stockService->adjust(
                        productId: $updated->id,
                        delta: $initialStock,
                        note: 'Carga inicial de stock',
                        createdBy: auth()->id(),
                        reason: StockMovementReasonEnum::InitialStock,
                    );
                }
            }
        }

        return Response::success($updated);
    }

    /**
     * stockAdjustment — ajuste manual de inventario (reposición, conteo físico, merma).
     * Nunca escribe stock directo: siempre pasa por StockService::adjust() para quedar
     * auditado en stock_movements.
     */
    public function stockAdjustment(ProductModel $product, ProductStockAdjustmentRequest $param, StockService $stockService): JsonResponse
    {
        if (! $product->manage_stock) {
            return Response::error('Este producto no maneja stock.');
        }

        try {
            $updated = $stockService->adjust(
                productId: $product->id,
                delta: (float) $param->delta,
                note: $param->note,
                createdBy: auth()->id(),
                variantId: $param->variant_id ?? null,
            );
        } catch (InsufficientStockException $e) {
            return Response::error($e->getMessage());
        }

        return Response::success($updated);
    }

    /**
     * stockMovements — historial paginado de movimientos de stock del producto (kardex),
     * más reciente primero.
     */
    public function stockMovements(ProductModel $product, IndexData $data, StockMovementsService $service): JsonResponse
    {
        return $service->run($data);
    }

    public function delete(ProductModel $product): JsonResponse
    {
        $picture = $product->picture;
        $product->delete();

        if ($picture) {
            ProductImageModel::deleteFile($picture->nombre_archivo);
            $picture->delete();
        }

        return Response::success(true);
    }
}
