<?php

namespace App\Services;

use App\Core\Enums\Http;
use App\Enums\ActivityTypeEnum;
use App\Enums\BusinessTypeEnum;
use App\Enums\RoleEnum;
use App\Enums\SubscriptionStatusEnum;
use App\Models\BusinessConfigModel;
use App\Models\PersonalAccessToken;
use App\Models\User;

class AuthService
{
    public function __construct(
        private readonly RolePermissionService $rolePermissionService,
        private readonly TenantActivityService $activityService,
    ) {}

    public function login(string $email, string $password, ?string $slug): AuthAttemptResult
    {
        $result = User::login(email: $email, password: $password);

        if ($result === User::LOGIN_INACTIVE) {
            return AuthAttemptResult::fail(__('Tu cuenta ha sido desactivada. Contacta al administrador.'));
        }

        if (! $result) {
            return AuthAttemptResult::fail(__('Credenciales no válidas.'));
        }

        if ($result['user']->rol_id === RoleEnum::SUPERADMIN->value) {
            $result['user']->tokens()->latest()->first()?->delete();

            return AuthAttemptResult::fail(__('Accede desde el panel de super administrador.'));
        }

        if ($slug) {
            $tenant = BusinessConfigModel::where(BusinessConfigModel::SLUG, $slug)->first();

            if (! $tenant || $result['user']->tenant_id !== $tenant->id) {
                $result['user']->tokens()->latest()->first()?->delete();

                return AuthAttemptResult::fail(__('Credenciales no válidas.'));
            }
        }

        $tenant = $result['user']->tenant;

        if ($tenant) {
            $status = $tenant->subscription_status;

            if (in_array($status, [SubscriptionStatusEnum::Expired->value, SubscriptionStatusEnum::Pending->value])) {
                $result['user']->tokens()->latest()->first()?->delete();

                $message = $status === SubscriptionStatusEnum::Pending->value
                    ? 'Este negocio aún no tiene una suscripción activa. Contacta al administrador para activar tu plan.'
                    : 'La suscripción de este negocio ha vencido. Contacta al administrador para renovarla.';

                return AuthAttemptResult::fail($message, 'SUBSCRIPTION_EXPIRED', Http::Forbidden);
            }
        }

        // A partir de aquí el login es válido salvo por el cupo del plan. Se cierra
        // cualquier otra sesión de la MISMA cuenta antes de evaluar el cupo, para que
        // reloguear desde un dispositivo nuevo reemplace la sesión anterior en vez de
        // competir por cupo contra sí misma.
        $result['user']->revokeOtherSessions($result['access_token_id']);
        unset($result['access_token_id']);

        if ($tenant) {
            $activeSessions = PersonalAccessToken::query()
                ->activeForTenant($tenant->id)
                ->count();

            if ($activeSessions >= $tenant->effectiveMaxUsers()) {
                $result['user']->tokens()->latest()->first()?->delete();

                return AuthAttemptResult::fail(
                    'Se alcanzó el límite de usuarios simultáneos. Intenta más tarde.',
                    'CONCURRENT_USERS_LIMIT',
                    Http::Forbidden,
                );
            }
        }

        if ($tenant) {
            $this->activityService->log($tenant->id, ActivityTypeEnum::LOGIN);
        }

        $result['features'] = $tenant?->tipo_negocio->features() ?? BusinessTypeEnum::Restaurante->features();
        $result['role_permissions'] = $tenant ? $this->rolePermissionService->grantedMapForTenant($tenant->id) : null;
        $result['tenant_slug'] = $tenant?->slug;

        return AuthAttemptResult::ok($result);
    }
}
