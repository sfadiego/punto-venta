<?php

namespace Tests\Security;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BranchModel;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderStatusModel;
use App\Models\PaymentMethodModel;
use App\Models\ProductModel;
use App\Models\User;
use Tests\TestCase;

/**
 * Fase 3: filtro opcional branch_id en average-ticket, best-seller y sales-by-category.
 * Cubre que el filtro realmente aísla los datos de una sucursal (no solo que el parámetro
 * se acepte) y que un usuario sin acceso a esa sucursal no puede consultarla.
 */
class BranchStatisticsTest extends TestCase
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

    private function crearCaja(int $branchId): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN->value,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => $this->admin()->id,
            MainOrderReportModel::TENANT_ID => $this->tenantId(),
            MainOrderReportModel::BRANCH_ID => $branchId,
        ]);
    }

    private function crearProducto(float $precio): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE => "Producto $precio ".uniqid(),
            ProductModel::PRECIO => $precio,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
        ]);
    }

    /** Crea y cierra una orden con un solo producto, vía API (igual patrón que CloseSalesTotalsTest). */
    private function crearOrdenCerrada(int $cajaId, ProductModel $producto, float $precio, int $cantidad = 1): OrderModel
    {
        $orden = OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Orden Test',
            OrderModel::TOTAL => 0,
            OrderModel::SUBTOTAL => 0,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusModel::first()->id,
            OrderModel::SISTEMA_ID => $cajaId,
            OrderModel::TENANT_ID => $this->tenantId(),
        ]);

        $this->postJson("/api/order/{$orden->id}/product", [
            'producto_id' => $producto->id,
            'cantidad' => $cantidad,
            'precio' => $precio,
        ], $this->authHeaders())->assertStatus(200);

        $metodoPago = PaymentMethodModel::create([
            PaymentMethodModel::NAME => 'Efectivo '.uniqid(),
            PaymentMethodModel::ACTIVE => true,
        ]);

        $this->putJson("/api/order/{$orden->id}", [
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            OrderModel::PAYMENT_METHOD_ID => $metodoPago->id,
        ], $this->authHeaders())->assertStatus(200);

        return $orden->refresh();
    }

    public function test_average_ticket_filtra_por_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursalA = $this->crearSucursal('A');
        $sucursalB = $this->crearSucursal('B');
        $cajaA = $this->crearCaja($sucursalA->id);
        $cajaB = $this->crearCaja($sucursalB->id);

        $this->crearOrdenCerrada($cajaA->id, $this->crearProducto(100), 100);
        $this->crearOrdenCerrada($cajaB->id, $this->crearProducto(500), 500);

        $data = $this->getJson('/api/admin/system/statistics/average-ticket?branch_id='.$sucursalA->id, $this->authHeaders($this->admin()))
            ->assertStatus(200)
            ->json('data');

        $this->assertEquals(100.0, $data['total_revenue']);
        $this->assertEquals(1, $data['orders_count']);
    }

    public function test_best_seller_filtra_por_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursalA = $this->crearSucursal('A');
        $sucursalB = $this->crearSucursal('B');
        $cajaA = $this->crearCaja($sucursalA->id);
        $cajaB = $this->crearCaja($sucursalB->id);

        $productoA = $this->crearProducto(100);
        $productoB = $this->crearProducto(200);
        $this->crearOrdenCerrada($cajaA->id, $productoA, 100);
        $this->crearOrdenCerrada($cajaB->id, $productoB, 200);

        $data = $this->getJson('/api/admin/system/statistics/best-seller?branch_id='.$sucursalA->id, $this->authHeaders($this->admin()))
            ->assertStatus(200)
            ->json('data');

        $ids = collect($data)->pluck('id');
        $this->assertTrue($ids->contains($productoA->id));
        $this->assertFalse($ids->contains($productoB->id));
    }

    public function test_sales_by_category_filtra_por_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursalA = $this->crearSucursal('A');
        $sucursalB = $this->crearSucursal('B');
        $cajaA = $this->crearCaja($sucursalA->id);
        $cajaB = $this->crearCaja($sucursalB->id);

        $this->crearOrdenCerrada($cajaA->id, $this->crearProducto(150), 150);
        $this->crearOrdenCerrada($cajaB->id, $this->crearProducto(300), 300);

        $data = $this->getJson('/api/order/sales-by-category?sistema_id='.$cajaA->id.'&branch_id='.$sucursalA->id, $this->authHeaders($this->admin()))
            ->assertStatus(200)
            ->json('data');

        $totalRevenue = collect($data['categories'])->sum('total_revenue');
        $this->assertEquals(150.0, $totalRevenue);
    }

    public function test_order_index_filtra_ordenes_cerradas_por_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursalA = $this->crearSucursal('A');
        $sucursalB = $this->crearSucursal('B');
        $cajaA = $this->crearCaja($sucursalA->id);
        $cajaB = $this->crearCaja($sucursalB->id);

        $ordenA = $this->crearOrdenCerrada($cajaA->id, $this->crearProducto(100), 100);
        $ordenB = $this->crearOrdenCerrada($cajaB->id, $this->crearProducto(200), 200);

        $data = $this->getJson(
            '/api/order?estatus_pedido_id='.OrderStatusEnum::CLOSED->value.'&branch_id='.$sucursalA->id,
            $this->authHeaders($this->admin())
        )
            ->assertStatus(206)
            ->json('data');

        $ids = collect($data)->pluck('id');
        $this->assertTrue($ids->contains($ordenA->id));
        $this->assertFalse($ids->contains($ordenB->id));
    }

    public function test_empleado_sin_acceso_no_puede_filtrar_ordenes_por_esa_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('A');
        $empleado = User::factory()->create([
            User::ROL_ID => RoleEnum::EMPLOYE->value,
            User::TENANT_ID => $this->tenantId(),
        ]);

        $this->getJson('/api/order?branch_id='.$sucursal->id, $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    public function test_empleado_sin_acceso_no_puede_filtrar_average_ticket_por_esa_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('A');
        $empleado = User::factory()->create([
            User::ROL_ID => RoleEnum::EMPLOYE->value,
            User::TENANT_ID => $this->tenantId(),
        ]);

        $this->getJson('/api/admin/system/statistics/average-ticket?branch_id='.$sucursal->id, $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    public function test_empleado_sin_acceso_no_puede_filtrar_best_seller_por_esa_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('A');
        $empleado = User::factory()->create([
            User::ROL_ID => RoleEnum::EMPLOYE->value,
            User::TENANT_ID => $this->tenantId(),
        ]);

        $this->getJson('/api/admin/system/statistics/best-seller?branch_id='.$sucursal->id, $this->authHeaders($empleado))
            ->assertStatus(403);
    }
}
