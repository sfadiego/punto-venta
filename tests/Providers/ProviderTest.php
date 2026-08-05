<?php

namespace Tests\Providers;

use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\ProviderModel;
use App\Models\ProviderPurchaseModel;
use App\Models\User;
use Tests\TestCase;

class ProviderTest extends TestCase
{
    private function crearProveedor(array $overrides = []): ProviderModel
    {
        return ProviderModel::create(array_merge([
            ProviderModel::NAME => 'Proveedor Test '.uniqid(),
            ProviderModel::PHONE => '5512345678',
            ProviderModel::CONTACT_NAME => 'Juan Pérez',
            ProviderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ], $overrides));
    }

    private function crearCompra(int $providerId, array $overrides = []): ProviderPurchaseModel
    {
        return ProviderPurchaseModel::create(array_merge([
            ProviderPurchaseModel::PROVIDER_ID => $providerId,
            ProviderPurchaseModel::AMOUNT => 500,
            ProviderPurchaseModel::NOTE => 'Compra de insumos',
            ProviderPurchaseModel::TENANT_ID => BusinessConfigModel::first()->id,
        ], $overrides));
    }

    private function fijarFecha(ProviderPurchaseModel $purchase, $fecha): void
    {
        $purchase->created_at = $fecha;
        $purchase->saveQuietly();
    }

    // ── Index ────────────────────────────────────────────────

    public function test_lista_proveedores_paginada(): void
    {
        $this->crearProveedor();

        $this->getJson('/api/provider?page=1&limit=5', $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonStructure(['current_page', 'data', 'total', 'per_page']);
    }

    public function test_busca_proveedor_por_nombre(): void
    {
        $provider = $this->crearProveedor(['name' => 'Distribuidora Norte']);
        $this->crearProveedor(['name' => 'Otro Proveedor']);

        $response = $this->getJson('/api/provider?search=Distribuidora Norte', $this->authHeaders())
            ->assertStatus(206);

        $names = array_column($response->json('data'), 'name');
        $this->assertContains($provider->name, $names);
        $this->assertNotContains('Otro Proveedor', $names);
    }

    public function test_lista_proveedores_simple(): void
    {
        $this->crearProveedor();

        $response = $this->getJson('/api/provider/list', $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['status', 'data' => [['id', 'name', 'phone', 'contact_name']]]);
    }

    // ── Store ────────────────────────────────────────────────

    public function test_crea_proveedor(): void
    {
        $response = $this->postJson('/api/provider', [
            'name' => 'Distribuidora Norte',
            'phone' => '5512345678',
            'contact_name' => 'Juan Pérez',
        ], $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.name', 'Distribuidora Norte')
            ->assertJsonPath('data.contact_name', 'Juan Pérez');

        $this->assertDatabaseHas('providers', ['name' => 'Distribuidora Norte']);
    }

    public function test_no_crea_proveedor_con_nombre_duplicado(): void
    {
        $existing = $this->crearProveedor();

        $this->postJson('/api/provider', [
            'name' => $existing->name,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_proveedor_sin_nombre(): void
    {
        $this->postJson('/api/provider', [], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_empleado_no_puede_crear_proveedor(): void
    {
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();

        $this->postJson('/api/provider', [
            'name' => 'Distribuidora Norte',
        ], $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    // ── Show ─────────────────────────────────────────────────

    public function test_muestra_proveedor(): void
    {
        $provider = $this->crearProveedor();

        $this->getJson("/api/provider/{$provider->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.id', $provider->id);
    }

    public function test_proveedor_inexistente_retorna_404(): void
    {
        $this->getJson('/api/provider/99999', $this->authHeaders())
            ->assertStatus(404);
    }

    // ── Update ───────────────────────────────────────────────

    public function test_actualiza_proveedor(): void
    {
        $provider = $this->crearProveedor();

        $this->putJson("/api/provider/{$provider->id}", [
            'name' => 'Nombre Actualizado',
            'phone' => '5599998888',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.name', 'Nombre Actualizado');

        $this->assertDatabaseHas('providers', ['id' => $provider->id, 'name' => 'Nombre Actualizado']);
    }

    public function test_actualiza_proveedor_con_mismo_nombre(): void
    {
        $provider = $this->crearProveedor();

        $this->putJson("/api/provider/{$provider->id}", [
            'name' => $provider->name,
            'phone' => $provider->phone,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    // ── Delete ───────────────────────────────────────────────

    public function test_elimina_proveedor(): void
    {
        $provider = $this->crearProveedor();

        $this->deleteJson("/api/provider/{$provider->id}", [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertSoftDeleted('providers', ['id' => $provider->id]);
    }

    public function test_empleado_no_puede_eliminar_proveedor(): void
    {
        $provider = $this->crearProveedor();
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();

        $this->deleteJson("/api/provider/{$provider->id}", [], $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    // ── Compras: Store ──────────────────────────────────────

    public function test_registra_compra_a_proveedor(): void
    {
        $provider = $this->crearProveedor();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $response = $this->postJson("/api/provider/{$provider->id}/purchase", [
            'amount' => 750.50,
            'note' => 'Compra de carne',
        ], $this->authHeaders($admin));

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.amount', '750.50')
            ->assertJsonPath('data.note', 'Compra de carne')
            ->assertJsonPath('data.provider_id', $provider->id)
            ->assertJsonPath('data.created_by', $admin->id);

        $this->assertDatabaseHas('provider_purchases', [
            'provider_id' => $provider->id,
            'note' => 'Compra de carne',
        ]);
    }

    public function test_no_registra_compra_sin_monto(): void
    {
        $provider = $this->crearProveedor();

        $this->postJson("/api/provider/{$provider->id}/purchase", [
            'note' => 'Sin monto',
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_registra_compra_con_monto_negativo_o_cero(): void
    {
        $provider = $this->crearProveedor();

        $this->postJson("/api/provider/{$provider->id}/purchase", [
            'amount' => 0,
        ], $this->authHeaders())
            ->assertStatus(400);

        $this->postJson("/api/provider/{$provider->id}/purchase", [
            'amount' => -10,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_empleado_no_puede_registrar_compra(): void
    {
        $provider = $this->crearProveedor();
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();

        $this->postJson("/api/provider/{$provider->id}/purchase", [
            'amount' => 100,
        ], $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    // ── Compras: Index / filtros por fecha ───────────────────

    public function test_lista_compras_de_un_proveedor(): void
    {
        $provider = $this->crearProveedor();
        $this->crearCompra($provider->id, ['amount' => 100, 'note' => 'Compra 1']);
        $this->crearCompra($provider->id, ['amount' => 200, 'note' => 'Compra 2']);

        $response = $this->getJson("/api/provider/{$provider->id}/purchase", $this->authHeaders())
            ->assertStatus(200);

        $notes = array_column($response->json('data'), 'note');
        $this->assertCount(2, $notes);
        $this->assertContains('Compra 1', $notes);
        $this->assertContains('Compra 2', $notes);
    }

    public function test_lista_compras_no_incluye_compras_de_otro_proveedor(): void
    {
        $providerA = $this->crearProveedor();
        $providerB = $this->crearProveedor();
        $this->crearCompra($providerA->id, ['note' => 'Compra proveedor A']);
        $this->crearCompra($providerB->id, ['note' => 'Compra proveedor B']);

        $response = $this->getJson("/api/provider/{$providerA->id}/purchase", $this->authHeaders())
            ->assertStatus(200);

        $notes = array_column($response->json('data'), 'note');
        $this->assertContains('Compra proveedor A', $notes);
        $this->assertNotContains('Compra proveedor B', $notes);
    }

    public function test_filtra_compras_por_fecha_puntual(): void
    {
        $provider = $this->crearProveedor();
        $this->fijarFecha($this->crearCompra($provider->id, ['note' => 'Compra hoy']), now());
        $this->fijarFecha($this->crearCompra($provider->id, ['note' => 'Compra otro día']), now()->subDays(5));

        $response = $this->getJson(
            "/api/provider/{$provider->id}/purchase?date=".now()->toDateString(),
            $this->authHeaders(),
        )->assertStatus(200);

        $notes = array_column($response->json('data'), 'note');
        $this->assertContains('Compra hoy', $notes);
        $this->assertNotContains('Compra otro día', $notes);
    }

    public function test_filtra_compras_por_semana(): void
    {
        $provider = $this->crearProveedor();
        $inicioSemana = now()->startOfWeek(\Carbon\Carbon::MONDAY);

        $this->fijarFecha(
            $this->crearCompra($provider->id, ['note' => 'Compra en semana']),
            $inicioSemana->copy()->addDays(2),
        );
        $this->fijarFecha(
            $this->crearCompra($provider->id, ['note' => 'Compra fuera de semana']),
            $inicioSemana->copy()->subWeeks(2),
        );

        $response = $this->getJson(
            "/api/provider/{$provider->id}/purchase?week=".$inicioSemana->toDateString(),
            $this->authHeaders(),
        )->assertStatus(200);

        $notes = array_column($response->json('data'), 'note');
        $this->assertContains('Compra en semana', $notes);
        $this->assertNotContains('Compra fuera de semana', $notes);
    }

    public function test_filtra_compras_por_mes(): void
    {
        $provider = $this->crearProveedor();
        $esteMes = now()->startOfMonth();

        $this->fijarFecha(
            $this->crearCompra($provider->id, ['note' => 'Compra de este mes']),
            $esteMes->copy()->addDays(3),
        );
        $this->fijarFecha(
            $this->crearCompra($provider->id, ['note' => 'Compra de otro mes']),
            $esteMes->copy()->subMonths(2),
        );

        $response = $this->getJson(
            "/api/provider/{$provider->id}/purchase?month=".$esteMes->format('Y-m'),
            $this->authHeaders(),
        )->assertStatus(200);

        $notes = array_column($response->json('data'), 'note');
        $this->assertContains('Compra de este mes', $notes);
        $this->assertNotContains('Compra de otro mes', $notes);
    }

    public function test_sin_filtro_retorna_todas_las_compras(): void
    {
        $provider = $this->crearProveedor();
        $this->fijarFecha($this->crearCompra($provider->id, ['note' => 'Compra 1']), now()->subMonths(3));
        $this->fijarFecha($this->crearCompra($provider->id, ['note' => 'Compra 2']), now());

        $response = $this->getJson("/api/provider/{$provider->id}/purchase", $this->authHeaders())
            ->assertStatus(200);

        $this->assertCount(2, $response->json('data'));
    }

    // ── Auth ─────────────────────────────────────────────────

    public function test_sin_autenticacion_no_accede_a_index(): void
    {
        $this->getJson('/api/provider')->assertStatus(401);
    }

    public function test_sin_autenticacion_no_accede_a_store(): void
    {
        $this->postJson('/api/provider', ['name' => 'Distribuidora Norte'])
            ->assertStatus(401);
    }

    // ── Aislamiento multi-tenant ──────────────────────────────

    public function test_aislamiento_multi_tenant_proveedores(): void
    {
        $providerA = $this->crearProveedor(['name' => 'Proveedor tenant A']);

        $tenantB = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'tenant-b-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Tenant B',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'lifetime',
        ]);

        $adminB = User::create([
            User::NOMBRE => 'Admin',
            User::APELLIDO_PATERNO => 'B',
            User::APELLIDO_MATERNO => '',
            User::EMAIL => 'admin-b-'.uniqid().'@test.com',
            User::USUARIO => 'admin-b-'.uniqid(),
            User::PASSWORD => bcrypt('password123'),
            User::ROL_ID => RoleEnum::ADMIN->value,
            User::ACTIVO => true,
            User::TENANT_ID => $tenantB->id,
        ]);

        // El proveedor de tenant A no debe ser visible ni editable desde tenant B
        $this->getJson("/api/provider/{$providerA->id}", $this->authHeaders($adminB))
            ->assertStatus(404);

        $this->putJson("/api/provider/{$providerA->id}", [
            'name' => 'Intento cross-tenant',
        ], $this->authHeaders($adminB))
            ->assertStatus(404);

        $this->postJson("/api/provider/{$providerA->id}/purchase", [
            'amount' => 100,
        ], $this->authHeaders($adminB))
            ->assertStatus(404);

        // El listado paginado de tenant B no debe incluir proveedores de tenant A
        $response = $this->getJson('/api/provider?limit=50', $this->authHeaders($adminB))
            ->assertStatus(206);

        $names = array_column($response->json('data'), 'name');
        $this->assertNotContains('Proveedor tenant A', $names);
    }

    public function test_no_permite_nombre_duplicado_de_otro_proveedor_del_mismo_tenant_al_actualizar(): void
    {
        $providerA = $this->crearProveedor(['name' => 'Proveedor A']);
        $providerB = $this->crearProveedor(['name' => 'Proveedor B']);

        $this->putJson("/api/provider/{$providerB->id}", [
            'name' => $providerA->name,
        ], $this->authHeaders())
            ->assertStatus(400);
    }
}
