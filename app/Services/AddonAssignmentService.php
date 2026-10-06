<?php

namespace App\Services;

use App\Models\AddonModel;

/**
 * Asignación de un topping a productos desde el lado del catálogo (el inverso de enviar
 * addon_ids al guardar un producto). Servicio plano de lógica de negocio: no hereda de
 * DataTable, que se reserva para listados paginados (ver AddonService).
 */
class AddonAssignmentService
{
    /**
     * Reemplaza el conjunto completo de productos del topping. addon_product no usa HasTenant
     * (tabla pivote), así que tenant_id va explícito en cada fila — mismo criterio que
     * ProductController::syncAddons().
     */
    public function syncProducts(AddonModel $addon, array $productIds): AddonModel
    {
        $pivotData = collect($productIds)
            ->mapWithKeys(fn ($productId) => [(int) $productId => [AddonModel::TENANT_ID => $addon->tenant_id]]);

        $addon->products()->sync($pivotData);

        return $this->withProductIds($addon);
    }

    /** Adjunta product_ids (ids de productos vigentes) para que el frontend arme el panel de asignación. */
    public function withProductIds(AddonModel $addon): AddonModel
    {
        $addon->setAttribute('product_ids', $addon->products()->pluck('product.id')->all());

        return $addon;
    }
}
