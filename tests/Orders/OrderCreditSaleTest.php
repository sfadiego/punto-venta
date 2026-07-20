<?php

namespace Tests\Orders;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\CustomerModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\OrderStatusModel;
use App\Models\ProductModel;
use App\Models\User;
use Tests\TestCase;

class OrderCreditSaleTest extends TestCase
{
    private function crearCliente(array $overrides = []): CustomerModel
    {
        return CustomerModel::create(array_merge([
            CustomerModel::NAME => 'Loncheria Test '.uniqid(),
            CustomerModel::PHONE => '5512345678',
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
        ], $overrides));
    }

    private function crearOrdenConProducto(float $precio = 100): OrderModel
    {
        $report = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        $order = OrderModel::create([
            OrderModel::TOTAL => 0,
            OrderModel::SUBTOTAL => 0,
            OrderModel::DESCUENTO => 0,
            OrderModel::NOMBRE_PEDIDO => 'Venta a crédito test',
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS->value,
            OrderModel::SISTEMA_ID => $report->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        $product = ProductModel::create([
            ProductModel::NOMBRE => 'Bistec de res',
            ProductModel::PRECIO => $precio,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
        ]);

        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $order->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => $precio,
            OrderProductModel::DESCUENTO => 0,
        ]);

        return $order;
    }

    // ── Cierre de venta a crédito ────────────────────────────

    public function test_venta_a_credito_incrementa_balance_una_sola_vez(): void
    {
        $customer = $this->crearCliente();
        $order = $this->crearOrdenConProducto(100);

        $this->putJson("/api/order/{$order->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
            'is_credit' => true,
            'customer_id' => $customer->id,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.is_credit', true)
            ->assertJsonPath('data.customer_id', $customer->id);

        $this->assertEquals(100, (float) $customer->fresh()->balance);

        // Repetir el mismo PUT (ej. reintento) no debe duplicar el incremento
        $this->putJson("/api/order/{$order->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
            'is_credit' => true,
            'customer_id' => $customer->id,
        ], $this->authHeaders())
            ->assertStatus(200);

        $this->assertEquals(100, (float) $customer->fresh()->balance);
    }

    public function test_no_permite_venta_a_credito_si_cliente_no_tiene_credito_habilitado(): void
    {
        $customer = $this->crearCliente(['allow_credit' => false]);
        $order = $this->crearOrdenConProducto(100);

        $this->putJson("/api/order/{$order->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
            'is_credit' => true,
            'customer_id' => $customer->id,
        ], $this->authHeaders())
            ->assertStatus(400);

        $this->assertEquals(0, (float) $customer->fresh()->balance);
    }

    public function test_venta_normal_no_afecta_balance_de_clientes(): void
    {
        $order = $this->crearOrdenConProducto(100);

        $this->putJson("/api/order/{$order->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
        ], $this->authHeaders())
            ->assertStatus(200);

        $this->assertDatabaseCount('customer_payments', 0);
    }

    // ── Pagos / abonos ────────────────────────────────────────

    public function test_registrar_pago_disminuye_balance(): void
    {
        $customer = $this->crearCliente();
        $order = $this->crearOrdenConProducto(100);

        $this->putJson("/api/order/{$order->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
            'is_credit' => true,
            'customer_id' => $customer->id,
        ], $this->authHeaders());

        $this->postJson("/api/customer/{$customer->id}/payment", [
            'amount' => 40,
        ], $this->authHeaders())
            ->assertStatus(200);

        $this->assertEquals(60, (float) $customer->fresh()->balance);

        $this->postJson("/api/customer/{$customer->id}/payment", [
            'amount' => 60,
        ], $this->authHeaders())
            ->assertStatus(200);

        $this->assertEquals(0, (float) $customer->fresh()->balance);
    }

    public function test_pago_no_puede_exceder_balance(): void
    {
        $customer = $this->crearCliente();
        $order = $this->crearOrdenConProducto(50);

        $this->putJson("/api/order/{$order->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
            'is_credit' => true,
            'customer_id' => $customer->id,
        ], $this->authHeaders());

        $this->postJson("/api/customer/{$customer->id}/payment", [
            'amount' => 51,
        ], $this->authHeaders())
            ->assertStatus(400);

        $this->assertEquals(50, (float) $customer->fresh()->balance);
    }

    // ── Aislamiento multi-tenant ──────────────────────────────

    public function test_aislamiento_multi_tenant_clientes(): void
    {
        $customerA = $this->crearCliente();

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

        // El cliente de tenant A no debe ser visible desde tenant B
        $this->getJson("/api/customer/{$customerA->id}", $this->authHeaders($adminB))
            ->assertStatus(404);

        // Una orden de tenant B no puede referenciar un customer_id de tenant A
        $orderB = $this->crearOrdenParaTenant($tenantB->id, $adminB);

        $this->putJson("/api/order/{$orderB->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
            'is_credit' => true,
            'customer_id' => $customerA->id,
        ], $this->authHeaders($adminB))
            ->assertStatus(400);
    }

    private function crearOrdenParaTenant(int $tenantId, User $user): OrderModel
    {
        $report = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500,
            MainOrderReportModel::USER_ID => $user->id,
            MainOrderReportModel::TENANT_ID => $tenantId,
        ]);

        $order = OrderModel::create([
            OrderModel::TOTAL => 0,
            OrderModel::SUBTOTAL => 0,
            OrderModel::DESCUENTO => 0,
            OrderModel::NOMBRE_PEDIDO => 'Orden tenant B',
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS->value,
            OrderModel::SISTEMA_ID => $report->id,
            OrderModel::TENANT_ID => $tenantId,
        ]);

        $category = CategoryModel::create([
            CategoryModel::NOMBRE => 'Categoría tenant B',
            CategoryModel::TENANT_ID => $tenantId,
        ]);

        $product = ProductModel::create([
            ProductModel::NOMBRE => 'Producto tenant B',
            ProductModel::PRECIO => 50,
            ProductModel::CATEGORIA_ID => $category->id,
            ProductModel::ACTIVO => true,
            ProductModel::TENANT_ID => $tenantId,
        ]);

        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $order->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 50,
            OrderProductModel::DESCUENTO => 0,
        ]);

        return $order;
    }
}
