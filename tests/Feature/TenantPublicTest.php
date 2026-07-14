<?php

namespace Tests\Feature;

use App\Models\BusinessConfigModel;
use Tests\TestCase;

class TenantPublicTest extends TestCase
{
    // ── Show branding ─────────────────────────────────────────

    public function test_muestra_branding_tenant_activo(): void
    {
        $tenant = BusinessConfigModel::first();
        $tenant->update([BusinessConfigModel::ACTIVO => true]);

        $this->getJson("/api/tenant/{$tenant->slug}")
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure([
                'status',
                'data' => ['slug'],
            ]);
    }

    public function test_slug_invalido_retorna_404(): void
    {
        $this->getJson('/api/tenant/slug-que-no-existe')
            ->assertStatus(404);
    }

    public function test_tenant_inactivo_retorna_403(): void
    {
        $tenant = BusinessConfigModel::first();
        $tenant->update([BusinessConfigModel::ACTIVO => false]);

        $response = $this->getJson("/api/tenant/{$tenant->slug}")
            ->assertStatus(403);

        $this->assertEquals('TENANT_INACTIVE', $response->json('code'));
    }

    public function test_endpoint_es_publico_sin_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();
        $tenant->update([BusinessConfigModel::ACTIVO => true]);

        // No se pasan headers de auth — debe responder correctamente de todas formas
        $this->getJson("/api/tenant/{$tenant->slug}")
            ->assertStatus(200);
    }
}
