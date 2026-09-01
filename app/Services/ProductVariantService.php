<?php

namespace App\Services;

use App\Enums\StockMovementReasonEnum;
use App\Http\Requests\ProductVariantStoreRequest;
use App\Http\Requests\ProductVariantUpdateRequest;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;

class ProductVariantService
{
    public function create(ProductModel $product, ProductVariantStoreRequest $params, StockService $stockService): ProductVariantModel
    {
        $manageStock = $product->manage_stock;

        $variant = ProductVariantModel::create([
            ProductVariantModel::PRODUCT_ID => $product->id,
            ProductVariantModel::NOMBRE => $params->nombre,
            ProductVariantModel::PRECIO => $params->precio,
            ProductVariantModel::ORDEN => $params->orden ?? 0,
            ProductVariantModel::ACTIVO => $params->has('activo') ? (bool) $params->activo : true,
            // sin cantidad indicada: arranca en 0 (la carga real se aplica abajo como
            // movimiento) y el mínimo por defecto es 2 si no se especifica uno — mismo
            // patrón que ProductController::store().
            ProductVariantModel::STOCK => $manageStock ? 0 : null,
            ProductVariantModel::MIN_STOCK => $manageStock ? ($params->min_stock ?? ProductModel::MIN_STOCK_DEFAULT) : null,
        ]);

        // la existencia inicial se registra como movimiento (no como valor directo del
        // INSERT) para que quede auditada en el kardex desde el día uno.
        $initialStock = (float) ($params->stock ?? 0);
        if ($manageStock && $initialStock > 0) {
            $stockService->adjust(
                productId: $product->id,
                variantId: $variant->id,
                delta: $initialStock,
                note: 'Carga inicial de stock',
                createdBy: auth()->id(),
                reason: StockMovementReasonEnum::InitialStock,
            );
            $variant->refresh();
        }

        return $variant;
    }

    public function update(ProductVariantModel $variant, ProductVariantUpdateRequest $params): ProductVariantModel
    {
        $data = [];

        if ($params->has('nombre')) {
            $data[ProductVariantModel::NOMBRE] = $params->nombre;
        }
        if ($params->has('precio')) {
            $data[ProductVariantModel::PRECIO] = $params->precio;
        }
        if ($params->has('orden')) {
            $data[ProductVariantModel::ORDEN] = $params->orden;
        }
        if ($params->has('activo')) {
            $data[ProductVariantModel::ACTIVO] = (bool) $params->activo;
        }
        // el stock nunca se escribe directo aquí (igual que ProductModel::updateProduct) —
        // solo se modifica vía StockService, para quedar siempre auditado en el kardex.
        if ($params->has('min_stock')) {
            $data[ProductVariantModel::MIN_STOCK] = $params->min_stock;
        }

        $variant->update($data);

        return $variant->refresh();
    }

    public function delete(ProductVariantModel $variant): bool
    {
        return $variant->delete();
    }

    /**
     * Al activar "Maneja stock" en un producto que ya tenía variantes, las que se crearon
     * antes de esa activación se quedaron con stock null (create() solo inicializa en 0
     * cuando manage_stock ya estaba activo en ese momento, y update() nunca escribe stock
     * directo). Se inicializan aquí en 0 — mismo baseline sin movimiento que create(), no
     * hay carga inicial que auditar porque nunca hubo un valor previo.
     */
    public function backfillStockOnActivation(ProductModel $product): void
    {
        $product->variants()
            ->where(ProductVariantModel::ACTIVO, true)
            ->whereNull(ProductVariantModel::STOCK)
            ->get()
            ->each(function (ProductVariantModel $variant) {
                $variant->update([
                    ProductVariantModel::STOCK => 0,
                    ProductVariantModel::MIN_STOCK => $variant->min_stock ?? ProductModel::MIN_STOCK_DEFAULT,
                ]);
            });
    }
}
