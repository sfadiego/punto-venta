<?php

namespace Tests\SuperAdmin;

use App\Enums\ApiErrorCodeEnum;
use App\Enums\RoleEnum;
use App\Events\TenantSessionRevoked;
use App\Models\BusinessConfigModel;
use App\Models\PersonalAccessToken;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

/**
 * Desactivar o borrar un tenant saca de sesión a todos sus usuarios: se revocan sus tokens de Sanctum y,
 * si alguno sobreviviera, ResolveTenant lo bloquea con TENANT_INACTIVE (el frontend cierra sesión con ese código).
 */
class TenantSessionRevocationTest extends TestCase
{
    private const PROTECTED_ROUTE = '/api/category/list';

    private function superAdminHeaders(): array
    {
        $user = User::where('rol_id', RoleEnum::SUPERADMIN->value)->first();

        return $this->authHeaders($user);
    }

    private function tenantUser(BusinessConfigModel $tenant, RoleEnum $role = RoleEnum::EMPLOYE): User
    {
        return User::factory()->create([
            User::TENANT_ID => $tenant->id,
            User::ROL_ID => $role->value,
        ]);
    }

    private function otherTenant(): BusinessConfigModel
    {
        return BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'otro-negocio-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::BUSINESS_NAME => 'Otro Negocio',
        ]);
    }

    private function tokenCountOf(User $user): int
    {
        return PersonalAccessToken::where('tokenable_id', $user->id)->count();
    }

    /**
     * ResolveTenant deja `tenant_id` en el contenedor y, dentro de un mismo test, ese binding sobrevive entre
     * requests: TenantScope escondería al SuperAdmin (tenant_id nulo) al resolver su token. En producción cada
     * request arranca limpio, así que aquí se limpia el estado entre requests de distintos usuarios.
     */
    private function resetRequestState(): void
    {
        $this->app['auth']->forgetGuards();
        // auth:sanctum cambia el guard por defecto a sanctum (y config('auth.defaults.guard') con él), pero el
        // Auth::attempt() del login solo existe en 'web'.
        $this->app['auth']->shouldUse('web');
        $this->app->forgetInstance('tenant_id');
    }

    private function toggle(BusinessConfigModel $tenant): void
    {
        $this->resetRequestState();
        $this->patchJson("/api/super-admin/tenant/{$tenant->id}/toggle", [], $this->superAdminHeaders())
            ->assertStatus(200);
    }

    private function getWithToken(string $plainTextToken)
    {
        $this->resetRequestState();

        return $this->getJson(self::PROTECTED_ROUTE, ['Authorization' => "Bearer $plainTextToken"]);
    }

    public function test_desactivar_tenant_elimina_los_tokens_de_sus_usuarios(): void
    {
        $tenant = BusinessConfigModel::first();
        $admin = $this->tenantUser($tenant, RoleEnum::ADMIN);
        $employee = $this->tenantUser($tenant);
        $admin->issueAccessToken();
        $employee->issueAccessToken();

        $this->toggle($tenant);

        $this->assertSame(0, $this->tokenCountOf($admin));
        $this->assertSame(0, $this->tokenCountOf($employee));
        $this->assertSame(0, PersonalAccessToken::where(PersonalAccessToken::TENANT_ID, $tenant->id)->count());
    }

    public function test_desactivar_tenant_no_toca_los_tokens_de_otro_tenant(): void
    {
        $tenant = BusinessConfigModel::first();
        $other = $this->otherTenant();
        $otherUser = $this->tenantUser($other);
        $otherUser->issueAccessToken();
        $this->tenantUser($tenant)->issueAccessToken();

        $this->toggle($tenant);

        $this->assertSame(1, $this->tokenCountOf($otherUser));
    }

    public function test_desactivar_tenant_no_toca_los_tokens_del_superadmin(): void
    {
        $tenant = BusinessConfigModel::first();
        $superAdmin = User::where('rol_id', RoleEnum::SUPERADMIN->value)->first();
        $superAdminTokenId = $superAdmin->issueAccessToken()->accessToken->id;
        $this->tenantUser($tenant)->issueAccessToken();

        $this->toggle($tenant);

        $this->assertDatabaseHas('personal_access_tokens', ['id' => $superAdminTokenId]);
    }

    public function test_reactivar_tenant_no_restaura_tokens_pero_permite_volver_a_entrar(): void
    {
        $tenant = BusinessConfigModel::first();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->where(User::TENANT_ID, $tenant->id)->first();
        $admin->issueAccessToken();

        $this->toggle($tenant);
        $this->toggle($tenant);

        $this->assertTrue($tenant->refresh()->activo);
        $this->assertSame(0, $this->tokenCountOf($admin));

        $this->resetRequestState();
        $this->postJson('/api/auth/login', [
            'email' => $admin->email,
            'password' => env('APP_ADMIN_PASSWORD'),
        ])->assertStatus(200)->assertJsonStructure(['data' => ['access_token']]);
    }

    public function test_borrar_tenant_elimina_los_tokens_de_sus_usuarios(): void
    {
        $tenant = $this->otherTenant();
        $user = $this->tenantUser($tenant);
        $user->issueAccessToken();

        $this->deleteJson("/api/super-admin/tenant/{$tenant->id}", [], $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertSoftDeleted('business_config', ['id' => $tenant->id]);
        $this->assertSame(0, $this->tokenCountOf($user));
    }

    public function test_revoca_tokens_emitidos_sin_tenant_id(): void
    {
        $tenant = BusinessConfigModel::first();
        $user = $this->tenantUser($tenant);
        $token = $user->issueAccessToken()->accessToken;
        $token->forceFill([PersonalAccessToken::TENANT_ID => null])->save();

        $this->toggle($tenant);

        $this->assertSame(0, $this->tokenCountOf($user));
    }

    public function test_token_revocado_recibe_401(): void
    {
        $tenant = BusinessConfigModel::first();
        $plainTextToken = $this->tenantUser($tenant, RoleEnum::ADMIN)->issueAccessToken()->plainTextToken;
        $this->getWithToken($plainTextToken)->assertStatus(200);

        $this->toggle($tenant);

        $this->getWithToken($plainTextToken)->assertStatus(401);
    }

    public function test_token_sobreviviente_con_tenant_inactivo_recibe_tenant_inactive(): void
    {
        $tenant = BusinessConfigModel::first();
        $plainTextToken = $this->tenantUser($tenant, RoleEnum::ADMIN)->issueAccessToken()->plainTextToken;

        // Sin pasar por el endpoint, que revocaría los tokens.
        $tenant->update([BusinessConfigModel::ACTIVO => false]);

        $this->getWithToken($plainTextToken)
            ->assertStatus(403)
            ->assertJsonPath('code', ApiErrorCodeEnum::TenantInactive->value);
    }

    public function test_token_sobreviviente_con_tenant_borrado_recibe_tenant_inactive(): void
    {
        $tenant = BusinessConfigModel::first();
        $plainTextToken = $this->tenantUser($tenant, RoleEnum::ADMIN)->issueAccessToken()->plainTextToken;

        $tenant->delete();

        $this->getWithToken($plainTextToken)
            ->assertStatus(403)
            ->assertJsonPath('code', ApiErrorCodeEnum::TenantInactive->value);
    }

    public function test_desactivar_tenant_emite_el_aviso_de_sesion_revocada(): void
    {
        Event::fake([TenantSessionRevoked::class]);
        $tenant = BusinessConfigModel::first();

        $this->toggle($tenant);

        Event::assertDispatched(TenantSessionRevoked::class, fn (TenantSessionRevoked $event) => $event->tenantId === $tenant->id);
    }

    public function test_borrar_tenant_emite_el_aviso_de_sesion_revocada(): void
    {
        Event::fake([TenantSessionRevoked::class]);
        $tenant = $this->otherTenant();

        $this->deleteJson("/api/super-admin/tenant/{$tenant->id}", [], $this->superAdminHeaders())
            ->assertStatus(200);

        Event::assertDispatched(TenantSessionRevoked::class, fn (TenantSessionRevoked $event) => $event->tenantId === $tenant->id);
    }

    public function test_reactivar_tenant_no_emite_aviso(): void
    {
        $tenant = BusinessConfigModel::first();
        $tenant->update([BusinessConfigModel::ACTIVO => false]);
        Event::fake([TenantSessionRevoked::class]);

        $this->toggle($tenant);

        $this->assertTrue($tenant->refresh()->activo);
        Event::assertNotDispatched(TenantSessionRevoked::class);
    }
}
