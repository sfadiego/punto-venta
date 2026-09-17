<?php

namespace Tests\SuperAdmin;

use App\Enums\MainOrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BranchModel;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\ProductModel;
use App\Models\User;
use Tests\TestCase;

/**
 * La activación de sucursales (multi_branch_enabled) y la creación de las sucursales
 * iniciales de un tenant son exclusivas de SuperAdmin — mismo criterio de gobierno que
 * printer_enabled (ver CLAUDE.md). El tenant Admin sigue administrando el día a día vía
 * routes/modules/branches.php (ver BranchAuthorizationTest), pero no puede activarlas.
 */
class TenantBranchTest extends TestCase
{
    private function superAdminHeaders(): array
    {
        $user = User::where('rol_id', RoleEnum::SUPERADMIN->value)->first();

        return $this->authHeaders($user);
    }

    private function tenantId(): int
    {
        return BusinessConfigModel::first()->id;
    }

    public function test_superadmin_activa_sucursales_y_hace_backfill(): void
    {
        $tenantId = $this->tenantId();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->where('tenant_id', $tenantId)->first();
        $producto = ProductModel::factory()->create([ProductModel::TENANT_ID => $tenantId]);
        $caja = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN->value,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => $admin->id,
            MainOrderReportModel::TENANT_ID => $tenantId,
        ]);

        $this->postJson("/api/super-admin/tenant/{$tenantId}/branches/enable", [], $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertDatabaseHas('branches', ['name' => 'Principal', 'tenant_id' => $tenantId]);
        $principalId = BranchModel::where(BranchModel::TENANT_ID, $tenantId)
            ->where(BranchModel::NAME, 'Principal')->firstOrFail()->id;

        // Una caja SIEMPRE pertenece a una sucursal — se backfillea a Principal. Un
        // producto NO se restringe al activar: queda disponible en todas las sucursales
        // (sin filas en product_branch), la restricción es opcional y explícita.
        $this->assertDatabaseHas('main_order_report', ['id' => $caja->id, 'branch_id' => $principalId]);
        $this->assertDatabaseMissing('product_branch', ['product_id' => $producto->id]);
        $this->assertDatabaseHas('business_config', ['id' => $tenantId, 'multi_branch_enabled' => true]);
    }

    public function test_activacion_es_idempotente(): void
    {
        $tenantId = $this->tenantId();

        $this->postJson("/api/super-admin/tenant/{$tenantId}/branches/enable", [], $this->superAdminHeaders())
            ->assertStatus(200);
        $this->postJson("/api/super-admin/tenant/{$tenantId}/branches/enable", [], $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertEquals(
            1,
            BranchModel::where(BranchModel::TENANT_ID, $tenantId)->where(BranchModel::NAME, 'Principal')->count()
        );
    }

    public function test_activacion_no_afecta_a_otro_tenant(): void
    {
        $tenantId = $this->tenantId();
        $otroTenant = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'otro-tenant-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Otro Tenant',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
        ]);
        $categoriaOtroTenant = CategoryModel::withoutGlobalScopes()->create([
            CategoryModel::NOMBRE => 'Categoria Otro Tenant',
            CategoryModel::TENANT_ID => $otroTenant->id,
        ]);
        $productoOtroTenant = ProductModel::withoutGlobalScopes()->create([
            ProductModel::NOMBRE => 'Producto Otro Tenant',
            ProductModel::PRECIO => 10,
            ProductModel::CATEGORIA_ID => $categoriaOtroTenant->id,
            ProductModel::TENANT_ID => $otroTenant->id,
        ]);

        $this->postJson("/api/super-admin/tenant/{$tenantId}/branches/enable", [], $this->superAdminHeaders())
            ->assertStatus(200);

        // El producto del otro tenant nunca debe quedar restringido a la sucursal
        // "Principal" del tenant activado — este test cubre el bug real que se hubiera
        // introducido si BranchActivationService dependiera de app('tenant_id') (no
        // vinculado en rutas de SuperAdmin) en vez de filtrar explícitamente por el
        // tenant recibido.
        $this->assertDatabaseMissing('product_branch', ['product_id' => $productoOtroTenant->id]);
        $this->assertDatabaseHas('business_config', [
            'id' => $otroTenant->id,
            'multi_branch_enabled' => false,
        ]);
    }

    public function test_superadmin_crea_sucursal_para_tenant(): void
    {
        $tenantId = $this->tenantId();

        $this->postJson("/api/super-admin/tenant/{$tenantId}/branches", [
            'name' => 'Sucursal Centro',
        ], $this->superAdminHeaders())->assertStatus(200);

        $this->assertDatabaseHas('branches', ['name' => 'Sucursal Centro', 'tenant_id' => $tenantId]);
    }

    public function test_tenant_admin_no_puede_activar_sucursales(): void
    {
        $tenantId = $this->tenantId();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->where('tenant_id', $tenantId)->first();

        $this->postJson("/api/super-admin/tenant/{$tenantId}/branches/enable", [], $this->authHeaders($admin))
            ->assertStatus(403);
    }

    public function test_index_sin_autenticacion_superadmin_rechaza(): void
    {
        $tenantId = $this->tenantId();

        $this->getJson("/api/super-admin/tenant/{$tenantId}/branches")->assertStatus(401);
    }

    // ── toggleActive ─────────────────────────────────────────────

    public function test_superadmin_desactiva_una_sucursal(): void
    {
        $tenantId = $this->tenantId();
        // Dos sucursales activas: desactivar una es legítimo porque la otra sigue
        // disponible — desactivar la ÚNICA activa está bloqueado (ver test dedicado).
        BranchModel::create([BranchModel::NAME => 'Otra', BranchModel::TENANT_ID => $tenantId, BranchModel::ACTIVE => true]);
        $branch = BranchModel::create([
            BranchModel::NAME => 'Sucursal Toggle',
            BranchModel::TENANT_ID => $tenantId,
            BranchModel::ACTIVE => true,
        ]);

        $this->patchJson("/api/super-admin/tenant/{$tenantId}/branches/{$branch->id}/toggle", [], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.active', false);

        $this->assertDatabaseHas('branches', ['id' => $branch->id, 'active' => false]);
    }

    public function test_no_puede_desactivar_la_unica_sucursal_activa(): void
    {
        $tenantId = $this->tenantId();
        $branch = BranchModel::create([
            BranchModel::NAME => 'Única', BranchModel::TENANT_ID => $tenantId, BranchModel::ACTIVE => true,
        ]);

        $this->patchJson("/api/super-admin/tenant/{$tenantId}/branches/{$branch->id}/toggle", [], $this->superAdminHeaders())
            ->assertJsonPath('status', 'error');

        $this->assertDatabaseHas('branches', ['id' => $branch->id, 'active' => true]);
    }

    public function test_no_puede_desactivar_sucursal_con_caja_abierta(): void
    {
        $tenantId = $this->tenantId();
        BranchModel::create([BranchModel::NAME => 'Otra', BranchModel::TENANT_ID => $tenantId, BranchModel::ACTIVE => true]);
        $branch = BranchModel::create([
            BranchModel::NAME => 'Con Caja Abierta', BranchModel::TENANT_ID => $tenantId, BranchModel::ACTIVE => true,
        ]);
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->where('tenant_id', $tenantId)->first();
        MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN->value,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => $admin->id,
            MainOrderReportModel::TENANT_ID => $tenantId,
            MainOrderReportModel::BRANCH_ID => $branch->id,
        ]);

        $this->patchJson("/api/super-admin/tenant/{$tenantId}/branches/{$branch->id}/toggle", [], $this->superAdminHeaders())
            ->assertJsonPath('status', 'error');

        $this->assertDatabaseHas('branches', ['id' => $branch->id, 'active' => true]);
    }

    public function test_superadmin_reactiva_una_sucursal(): void
    {
        $tenantId = $this->tenantId();
        $branch = BranchModel::create([
            BranchModel::NAME => 'Sucursal Toggle',
            BranchModel::TENANT_ID => $tenantId,
            BranchModel::ACTIVE => false,
        ]);

        $this->patchJson("/api/super-admin/tenant/{$tenantId}/branches/{$branch->id}/toggle", [], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.active', true);
    }

    public function test_no_puede_alternar_sucursal_de_otro_tenant(): void
    {
        $tenantId = $this->tenantId();
        $otroTenant = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'otro-tenant-toggle-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Otro Tenant Toggle',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
        ]);
        $branchOtroTenant = BranchModel::create([
            BranchModel::NAME => 'Sucursal De Otro Tenant',
            BranchModel::TENANT_ID => $otroTenant->id,
            BranchModel::ACTIVE => true,
        ]);

        // Intenta alternar la sucursal del otro tenant usando el tenant "propio" en la URL.
        $this->patchJson(
            "/api/super-admin/tenant/{$tenantId}/branches/{$branchOtroTenant->id}/toggle",
            [],
            $this->superAdminHeaders()
        )->assertStatus(404);

        $this->assertDatabaseHas('branches', ['id' => $branchOtroTenant->id, 'active' => true]);
    }

    public function test_tenant_admin_no_puede_alternar_sucursal_via_superadmin(): void
    {
        $tenantId = $this->tenantId();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->where('tenant_id', $tenantId)->first();
        $branch = BranchModel::create([
            BranchModel::NAME => 'Sucursal Toggle',
            BranchModel::TENANT_ID => $tenantId,
            BranchModel::ACTIVE => true,
        ]);

        $this->patchJson("/api/super-admin/tenant/{$tenantId}/branches/{$branch->id}/toggle", [], $this->authHeaders($admin))
            ->assertStatus(403);
    }

    // ── update ───────────────────────────────────────────────────

    public function test_superadmin_actualiza_nombre_y_direccion_de_sucursal(): void
    {
        $tenantId = $this->tenantId();
        $branch = BranchModel::create([
            BranchModel::NAME => 'Nombre Viejo',
            BranchModel::TENANT_ID => $tenantId,
            BranchModel::ACTIVE => true,
        ]);

        $this->putJson("/api/super-admin/tenant/{$tenantId}/branches/{$branch->id}", [
            'name' => 'Nombre Nuevo',
            'address' => 'Nueva dirección 123',
        ], $this->superAdminHeaders())->assertStatus(200);

        $this->assertDatabaseHas('branches', [
            'id' => $branch->id,
            'name' => 'Nombre Nuevo',
            'address' => 'Nueva dirección 123',
        ]);
    }

    public function test_no_permite_nombre_duplicado_en_el_mismo_tenant(): void
    {
        $tenantId = $this->tenantId();
        BranchModel::create([BranchModel::NAME => 'Centro', BranchModel::TENANT_ID => $tenantId, BranchModel::ACTIVE => true]);
        $branch = BranchModel::create([BranchModel::NAME => 'Norte', BranchModel::TENANT_ID => $tenantId, BranchModel::ACTIVE => true]);

        $this->putJson("/api/super-admin/tenant/{$tenantId}/branches/{$branch->id}", [
            'name' => 'Centro',
        ], $this->superAdminHeaders())->assertStatus(400);

        $this->assertDatabaseHas('branches', ['id' => $branch->id, 'name' => 'Norte']);
    }

    public function test_no_puede_actualizar_sucursal_de_otro_tenant(): void
    {
        $tenantId = $this->tenantId();
        $otroTenant = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'otro-tenant-update-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Otro Tenant Update',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
        ]);
        $branchOtroTenant = BranchModel::create([
            BranchModel::NAME => 'Sucursal De Otro Tenant',
            BranchModel::TENANT_ID => $otroTenant->id,
            BranchModel::ACTIVE => true,
        ]);

        $this->putJson("/api/super-admin/tenant/{$tenantId}/branches/{$branchOtroTenant->id}", [
            'name' => 'Nombre Hackeado',
        ], $this->superAdminHeaders())->assertStatus(404);

        $this->assertDatabaseHas('branches', ['id' => $branchOtroTenant->id, 'name' => 'Sucursal De Otro Tenant']);
    }

    public function test_tenant_admin_no_puede_actualizar_sucursal_via_superadmin(): void
    {
        $tenantId = $this->tenantId();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->where('tenant_id', $tenantId)->first();
        $branch = BranchModel::create([
            BranchModel::NAME => 'Sucursal Update',
            BranchModel::TENANT_ID => $tenantId,
            BranchModel::ACTIVE => true,
        ]);

        $this->putJson("/api/super-admin/tenant/{$tenantId}/branches/{$branch->id}", [
            'name' => 'Nombre Hackeado',
        ], $this->authHeaders($admin))->assertStatus(403);
    }
}
