<?php

namespace Tests\SuperAdmin;

use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\User;
use Tests\TestCase;

class SubscriptionTest extends TestCase
{
    private function superAdminHeaders(): array
    {
        $user = User::where('rol_id', RoleEnum::SUPERADMIN->value)->first();

        return $this->authHeaders($user);
    }

    public function test_lista_excluye_tenants_inactivos(): void
    {
        $activo = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'activo-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Activo',
        ]);
        $inactivo = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'inactivo-'.uniqid(),
            BusinessConfigModel::ACTIVO => false,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Inactivo',
        ]);

        $response = $this->getJson('/api/super-admin/subscription', $this->superAdminHeaders())
            ->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');

        $this->assertTrue($ids->contains($activo->id));
        $this->assertFalse($ids->contains($inactivo->id));
    }

    public function test_lista_excluye_tenants_eliminados(): void
    {
        $eliminado = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'eliminado-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Eliminado',
        ]);
        $eliminado->delete();

        $response = $this->getJson('/api/super-admin/subscription', $this->superAdminHeaders())
            ->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertFalse($ids->contains($eliminado->id));
    }

    public function test_lista_demo_incluye_tenant_demo_inactivo(): void
    {
        $demoInactivo = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'demo-inactivo-'.uniqid(),
            BusinessConfigModel::ACTIVO => false,
            BusinessConfigModel::IS_DEMO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Demo Inactivo',
        ]);

        $response = $this->getJson('/api/super-admin/subscription?is_demo=1', $this->superAdminHeaders())
            ->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($demoInactivo->id));
    }

    public function test_lista_por_defecto_excluye_demo(): void
    {
        $demo = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'demo-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Demo',
        ]);

        $response = $this->getJson('/api/super-admin/subscription', $this->superAdminHeaders())
            ->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertFalse($ids->contains($demo->id));
    }

    public function test_sin_autenticacion_no_accede(): void
    {
        $this->getJson('/api/super-admin/subscription')->assertStatus(401);
    }
}
