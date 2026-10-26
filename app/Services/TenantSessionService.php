<?php

namespace App\Services;

use App\Events\TenantSessionRevoked;
use App\Models\BusinessConfigModel;
use App\Models\PersonalAccessToken;
use App\Models\User;

class TenantSessionService
{
    /**
     * Revoca todos los tokens de Sanctum del tenant para sacar a sus usuarios de sesión. Cubre tanto los
     * tokens con `tenant_id` como los emitidos antes de esa columna, buscando por los usuarios del tenant.
     * User tiene TenantScope y en un request de SuperAdmin `tenant_id` va en null, por eso se quita el scope.
     *
     * @return int Cantidad de tokens revocados.
     */
    public function revokeAll(BusinessConfigModel $tenant): int
    {
        $tenantUserIds = User::withoutGlobalScopes()
            ->where(User::TENANT_ID, $tenant->id)
            ->select('id');

        $revoked = PersonalAccessToken::query()
            ->where(PersonalAccessToken::TENANT_ID, $tenant->id)
            ->orWhere(function ($query) use ($tenantUserIds) {
                $query->where('tokenable_type', (new User)->getMorphClass())
                    ->whereIn('tokenable_id', $tenantUserIds);
            })
            ->delete();

        // Saca al instante a quien tenga la app abierta sin hacer peticiones (ver TenantSessionRevoked).
        TenantSessionRevoked::dispatchAfterCommit($tenant->id);

        return $revoked;
    }
}
