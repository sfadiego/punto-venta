<?php

namespace App\Services;

use App\Enums\StockMovementReasonEnum;
use App\Enums\StockMovementTypeEnum;
use App\Exceptions\InsufficientStockException;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use App\Models\StockMovementModel;
use Illuminate\Database\Eloquent\Model;

class StockService
{
    /**
     * Descuenta stock de un producto o, si se pasa $variantId, de una de sus variantes
     * (ej. venta). Lockea la fila del producto (y la de la variante, si aplica) para
     * serializar contra ventas concurrentes del mismo artículo y nunca deja el stock
     * en negativo.
     */
    public function deduct(
        int $productId,
        float $quantity,
        StockMovementReasonEnum $reason,
        ?int $variantId = null,
        ?Model $reference = null,
        ?int $createdBy = null,
        ?string $note = null,
    ): ProductModel|ProductVariantModel {
        return $this->applyMovement(
            $productId,
            $variantId,
            -$quantity,
            StockMovementTypeEnum::Exit,
            $reason,
            $reference,
            $createdBy,
            $note,
        );
    }

    /**
     * Devuelve stock a un producto o variante (ej. se borra un producto de una orden en proceso).
     */
    public function restore(
        int $productId,
        float $quantity,
        StockMovementReasonEnum $reason,
        ?int $variantId = null,
        ?Model $reference = null,
        ?int $createdBy = null,
        ?string $note = null,
    ): ProductModel|ProductVariantModel {
        return $this->applyMovement(
            $productId,
            $variantId,
            $quantity,
            StockMovementTypeEnum::Entry,
            $reason,
            $reference,
            $createdBy,
            $note,
        );
    }

    /**
     * Ajuste de inventario (ej. tras un conteo físico, o la carga inicial al crear
     * el producto/variante). $delta puede ser positivo (se encontró/carga más stock
     * del registrado) o negativo (merma, faltante). $reason por defecto es un ajuste
     * manual; se parametriza para distinguir la carga inicial (`InitialStock`) en
     * el kardex.
     */
    public function adjust(
        int $productId,
        float $delta,
        ?string $note = null,
        ?int $createdBy = null,
        StockMovementReasonEnum $reason = StockMovementReasonEnum::ManualAdjustment,
        ?int $variantId = null,
    ): ProductModel|ProductVariantModel {
        return $this->applyMovement(
            $productId,
            $variantId,
            $delta,
            StockMovementTypeEnum::Adjustment,
            $reason,
            null,
            $createdBy,
            $note,
        );
    }

    /**
     * Aplica el delta bajo lockForUpdate() y registra el movimiento en stock_movements.
     * No envuelve en DB::transaction() propio — TransactionMiddleware ya envuelve toda
     * request no-GET; el lock solo necesita estar dentro de esa transacción existente.
     *
     * Siempre lockea la fila del producto (serializa todas las mutaciones de stock del
     * producto, sean del producto base o de cualquiera de sus variantes). Si $variantId
     * viene, además lockea y muta la fila de la variante — el producto se deja intacto
     * en ese caso (su columna stock no se usa cuando el producto lleva stock por variante).
     */
    private function applyMovement(
        int $productId,
        ?int $variantId,
        float $delta,
        StockMovementTypeEnum $type,
        StockMovementReasonEnum $reason,
        ?Model $reference,
        ?int $createdBy,
        ?string $note,
    ): ProductModel|ProductVariantModel {
        $product = ProductModel::where('id', $productId)->lockForUpdate()->first();

        if (! $product) {
            throw new InsufficientStockException('El producto no existe.');
        }

        $stockable = $variantId
            ? ProductVariantModel::where('id', $variantId)
                ->where(ProductVariantModel::PRODUCT_ID, $productId)
                ->lockForUpdate()
                ->first()
            : $product;

        if ($variantId && ! $stockable) {
            throw new InsufficientStockException('La variante no existe.');
        }

        $stockBefore = (float) ($stockable->stock ?? 0);
        $stockAfter = $stockBefore + $delta;

        if ($stockAfter < 0) {
            $label = $variantId ? "{$product->nombre} ({$stockable->nombre})" : $product->nombre;
            throw new InsufficientStockException("Stock insuficiente para \"{$label}\".");
        }

        $stockable->update([
            $variantId ? ProductVariantModel::STOCK : ProductModel::STOCK => $stockAfter,
        ]);

        $movement = new StockMovementModel([
            StockMovementModel::PRODUCT_ID => $product->id,
            StockMovementModel::VARIANT_ID => $variantId,
            StockMovementModel::TYPE => $type,
            StockMovementModel::QUANTITY => abs($delta),
            StockMovementModel::STOCK_BEFORE => $stockBefore,
            StockMovementModel::STOCK_AFTER => $stockAfter,
            StockMovementModel::REASON => $reason,
            StockMovementModel::CREATED_BY => $createdBy,
            StockMovementModel::NOTE => $note,
        ]);

        if ($reference) {
            $movement->reference()->associate($reference);
        }

        $movement->save();

        return $stockable->refresh();
    }
}
