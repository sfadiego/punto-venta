<?php

namespace App\Services;

use App\Models\BranchModel;
use App\Models\BusinessConfigModel;
use App\Models\MainOrderReportModel;

/**
 * Activa el soporte de sucursales para un tenant que hoy opera en modo "sin sucursales".
 * Es una operación única por tenant: crea la sucursal "Principal" y le asigna (backfill)
 * las cajas que ya existían — una caja SIEMPRE pertenece a una sucursal específica, así
 * que no puede quedar huérfana al encender la feature.
 *
 * Los productos NO se restringen a "Principal" al activar — quedan disponibles en todas
 * las sucursales (branch_ids vacío en product_branch), consistente con el diseño de
 * "producto en múltiples sucursales": la asignación a una sucursal específica es una
 * restricción opcional que el Admin agrega explícitamente, nunca el estado por defecto.
 *
 * Se dispara desde el panel de SuperAdmin (no hay auto-activación por el tenant), donde
 * `app('tenant_id')` NO está vinculado (las rutas de SuperAdmin no pasan por
 * ResolveTenant) — por eso cada query aquí filtra explícitamente por $tenantId y usa
 * withoutGlobalScopes(), en vez de depender del scope automático de HasTenant. Sin esto,
 * un update sin filtro explícito corregiría/backfillearía filas de TODOS los tenants.
 */
class BranchActivationService
{
    public function enable(int $tenantId): BranchModel
    {
        $tenant = BusinessConfigModel::findOrFail($tenantId);

        if ($tenant->multi_branch_enabled) {
            return BranchModel::withoutGlobalScopes()
                ->where(BranchModel::TENANT_ID, $tenantId)
                ->firstOrFail();
        }

        $principal = BranchModel::create([
            BranchModel::NAME => 'Principal',
            BranchModel::ACTIVE => true,
            BranchModel::TENANT_ID => $tenantId,
        ]);

        MainOrderReportModel::withoutGlobalScopes()
            ->where(MainOrderReportModel::TENANT_ID, $tenantId)
            ->whereNull(MainOrderReportModel::BRANCH_ID)
            ->update([MainOrderReportModel::BRANCH_ID => $principal->id]);

        $tenant->update([BusinessConfigModel::MULTI_BRANCH_ENABLED => true]);

        return $principal;
    }
}
