<?php

namespace Tests\Security;

use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BranchModel;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\ProductModel;
use App\Models\User;
use Tests\TestCase;

/**
 * Fase 2 del feature "producto en múltiples sucursales": el catálogo de venta
 * (GET /product?branch_id=) filtra los productos con sucursales asignadas que no
 * incluyan la sucursal consultada, y agregar un producto no disponible a una orden se
 * rechaza aunque el cliente lo intente vía API directa (defensa en profundidad, el
 * frontend solo filtra la UI).
 */
class ProductBranchCatalogTest extends TestCase
{
    private function tenantId(): int
    {
        return BusinessConfigModel::first()->id;
    }

    private function admin(): User
    {
        return User::where('rol_id', RoleEnum::ADMIN->value)->first();
    }

    private function habilitarMultiSucursal(): void
    {
        BusinessConfigModel::find($this->tenantId())
            ->update([BusinessConfigModel::MULTI_BRANCH_ENABLED => true]);
    }

    private function crearSucursal(string $name): BranchModel
    {
        return BranchModel::create([
            BranchModel::NAME => $name,
            BranchModel::TENANT_ID => $this->tenantId(),
            BranchModel::ACTIVE => true,
        ]);
    }

    private function crearProducto(): ProductModel
    {
        return ProductModel::factory()->create([
            ProductModel::TENANT_ID => $this->tenantId(),
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
        ]);
    }

    private function crearOrdenEnSucursal(int $branchId): OrderModel
    {
        $sistema = MainOrderReportModel::openSales(100, $this->admin()->id, '', $branchId);

        return OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Mesa 1',
            OrderModel::SISTEMA_ID => $sistema->id,
            OrderModel::TENANT_ID => $this->tenantId(),
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS->value,
            OrderModel::TOTAL => 0,
            OrderModel::SUBTOTAL => 0,
        ]);
    }

    // ── GET /product?branch_id= — filtrado del catálogo ──────────

    public function test_producto_sin_sucursales_asignadas_aparece_en_cualquier_filtro(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('A');
        $producto = $this->crearProducto();

        $ids = collect(
            $this->getJson('/api/product?branch_id='.$sucursal->id, $this->authHeaders($this->admin()))
                ->assertStatus(206)
                ->json('data')
        )->pluck('id');

        $this->assertTrue($ids->contains($producto->id));
    }

    public function test_producto_asignado_a_otra_sucursal_no_aparece_en_el_filtro(): void
    {
        $this->habilitarMultiSucursal();
        $sucursalA = $this->crearSucursal('A');
        $sucursalB = $this->crearSucursal('B');
        $producto = $this->crearProducto();
        $producto->branches()->attach($sucursalA->id, [ProductModel::TENANT_ID => $this->tenantId()]);

        $ids = collect(
            $this->getJson('/api/product?branch_id='.$sucursalB->id, $this->authHeaders($this->admin()))
                ->assertStatus(206)
                ->json('data')
        )->pluck('id');

        $this->assertFalse($ids->contains($producto->id));
    }

    public function test_producto_asignado_a_la_sucursal_consultada_si_aparece(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('A');
        $producto = $this->crearProducto();
        $producto->branches()->attach($sucursal->id, [ProductModel::TENANT_ID => $this->tenantId()]);

        $ids = collect(
            $this->getJson('/api/product?branch_id='.$sucursal->id, $this->authHeaders($this->admin()))
                ->assertStatus(206)
                ->json('data')
        )->pluck('id');

        $this->assertTrue($ids->contains($producto->id));
    }

    public function test_sin_branch_id_el_catalogo_no_se_filtra(): void
    {
        $this->habilitarMultiSucursal();
        $sucursalA = $this->crearSucursal('A');
        $this->crearSucursal('B');
        $producto = $this->crearProducto();
        $producto->branches()->attach($sucursalA->id, [ProductModel::TENANT_ID => $this->tenantId()]);

        $ids = collect(
            $this->getJson('/api/product', $this->authHeaders($this->admin()))
                ->assertStatus(206)
                ->json('data')
        )->pluck('id');

        $this->assertTrue($ids->contains($producto->id));
    }

    public function test_empleado_sin_acceso_no_puede_filtrar_catalogo_por_esa_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('A');
        $empleado = User::factory()->create([
            User::ROL_ID => RoleEnum::EMPLOYE->value,
            User::TENANT_ID => $this->tenantId(),
        ]);

        $this->getJson('/api/product?branch_id='.$sucursal->id, $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    // ── POST /order/{order}/product — no se puede colar un producto ajeno ─

    public function test_no_se_puede_agregar_producto_no_disponible_en_la_sucursal_de_la_orden(): void
    {
        $this->habilitarMultiSucursal();
        $sucursalA = $this->crearSucursal('A');
        $sucursalB = $this->crearSucursal('B');
        $orden = $this->crearOrdenEnSucursal($sucursalB->id);
        $producto = $this->crearProducto();
        $producto->branches()->attach($sucursalA->id, [ProductModel::TENANT_ID => $this->tenantId()]);

        $this->postJson("/api/order/{$orden->id}/product", [
            'producto_id' => $producto->id,
            'cantidad' => 1,
            'precio' => $producto->precio,
        ], $this->authHeaders($this->admin()))->assertStatus(400);
    }

    public function test_se_puede_agregar_producto_disponible_en_la_sucursal_de_la_orden(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('A');
        $orden = $this->crearOrdenEnSucursal($sucursal->id);
        $producto = $this->crearProducto();
        $producto->branches()->attach($sucursal->id, [ProductModel::TENANT_ID => $this->tenantId()]);

        $this->postJson("/api/order/{$orden->id}/product", [
            'producto_id' => $producto->id,
            'cantidad' => 1,
            'precio' => $producto->precio,
        ], $this->authHeaders($this->admin()))->assertStatus(200);
    }

    public function test_se_puede_agregar_producto_sin_sucursales_asignadas_a_cualquier_orden(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('A');
        $orden = $this->crearOrdenEnSucursal($sucursal->id);
        $producto = $this->crearProducto();

        $this->postJson("/api/order/{$orden->id}/product", [
            'producto_id' => $producto->id,
            'cantidad' => 1,
            'precio' => $producto->precio,
        ], $this->authHeaders($this->admin()))->assertStatus(200);
    }
}
