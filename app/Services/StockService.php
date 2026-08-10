<?php

namespace App\Services;

use App\Enums\StockMovementReasonEnum;
use App\Enums\StockMovementTypeEnum;
use App\Exceptions\InsufficientStockException;
use App\Models\ProductModel;
use App\Models\StockMovementModel;
use Illuminate\Database\Eloquent\Model;

class StockService
{
    /**
     * Descuenta stock de un producto (ej. venta). Lockea la fila del producto para
     * serializar contra ventas concurrentes del mismo artículo y nunca deja el stock
     * en negativo.
     */
    public function deduct(
        int $productId,
        float $quantity,
        StockMovementReasonEnum $reason,
        ?Model $reference = null,
        ?int $createdBy = null,
        ?string $note = null,
    ): ProductModel {
        return $this->applyMovement(
            $productId,
            -$quantity,
            StockMovementTypeEnum::Exit,
            $reason,
            $reference,
            $createdBy,
            $note,
        );
    }

    /**
     * Devuelve stock a un producto (ej. se borra un producto de una orden en proceso).
     */
    public function restore(
        int $productId,
        float $quantity,
        StockMovementReasonEnum $reason,
        ?Model $reference = null,
        ?int $createdBy = null,
        ?string $note = null,
    ): ProductModel {
        return $this->applyMovement(
            $productId,
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
     * el producto). $delta puede ser positivo (se encontró/carga más stock del
     * registrado) o negativo (merma, faltante). $reason por defecto es un ajuste
     * manual; se parametriza para distinguir la carga inicial (`InitialStock`) en
     * el kardex.
     */
    public function adjust(
        int $productId,
        float $delta,
        ?string $note = null,
        ?int $createdBy = null,
        StockMovementReasonEnum $reason = StockMovementReasonEnum::ManualAdjustment,
    ): ProductModel {
        return $this->applyMovement(
            $productId,
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
     */
    private function applyMovement(
        int $productId,
        float $delta,
        StockMovementTypeEnum $type,
        StockMovementReasonEnum $reason,
        ?Model $reference,
        ?int $createdBy,
        ?string $note,
    ): ProductModel {
        $product = ProductModel::where('id', $productId)->lockForUpdate()->first();

        if (! $product) {
            throw new InsufficientStockException('El producto no existe.');
        }

        $stockBefore = (float) ($product->stock ?? 0);
        $stockAfter = $stockBefore + $delta;

        if ($stockAfter < 0) {
            throw new InsufficientStockException("Stock insuficiente para \"{$product->nombre}\".");
        }

        $product->update([ProductModel::STOCK => $stockAfter]);

        $movement = new StockMovementModel([
            StockMovementModel::PRODUCT_ID => $product->id,
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

        return $product->refresh();
    }
}
