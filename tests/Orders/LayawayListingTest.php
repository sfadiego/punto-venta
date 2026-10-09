<?php

namespace Tests\Orders;

use App\Enums\BusinessTypeEnum;
use App\Enums\LayawayPaymentTypeEnum;
use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BranchModel;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\CustomerModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderLayawayPaymentModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\PaymentMethodModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\RolePermission;
use App\Models\User;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * Lectura de apartados: listado (GET /order con estatus Apartado, sin acotar a la sesión de caja
 * activa), resumen para las tarjetas, detalle de la orden y detalle de cliente con su historial.
 */
class LayawayListingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value]);
    }

    private function crearCaja(?int $branchId = null, MainOrderStatusEnum $estatus = MainOrderStatusEnum::OPEN): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => $estatus,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
            MainOrderReportModel::BRANCH_ID => $branchId,
        ]);
    }

    private function crearCliente(): CustomerModel
    {
        return CustomerModel::create([
            CustomerModel::NAME => 'Cliente '.uniqid(),
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearApartado(
        MainOrderReportModel $caja,
        CustomerModel $customer,
        float $total,
        float $abonado,
        ?string $vence = null,
        OrderStatusEnum $estatus = OrderStatusEnum::LAYAWAY,
    ): OrderModel {
        $order = OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Apartado',
            OrderModel::TOTAL => $total,
            OrderModel::SUBTOTAL => $total,
            OrderModel::DESCUENTO => 0,
            OrderModel::ESTATUS_PEDIDO_ID => $estatus->value,
            OrderModel::SISTEMA_ID => $caja->id,
            OrderModel::CUSTOMER_ID => $customer->id,
            OrderModel::AMOUNT_PAID => $abonado,
            OrderModel::LAYAWAY_DUE_DATE => $vence ?? Carbon::today()->addDays(30)->toDateString(),
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        OrderLayawayPaymentModel::create([
            OrderLayawayPaymentModel::ORDER_ID => $order->id,
            OrderLayawayPaymentModel::CUSTOMER_ID => $customer->id,
            OrderLayawayPaymentModel::TYPE => LayawayPaymentTypeEnum::Deposit,
            OrderLayawayPaymentModel::AMOUNT => $abonado,
            OrderLayawayPaymentModel::PAYMENT_METHOD_ID => PaymentMethodModel::first()->id,
            OrderLayawayPaymentModel::SISTEMA_ID => $caja->id,
            OrderLayawayPaymentModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        return $order;
    }

    // ── Listado ──────────────────────────────────────────────

    public function test_listado_de_apartados_incluye_los_de_sesiones_anteriores_con_lo_abonado(): void
    {
        $cajaVieja = $this->crearCaja(estatus: MainOrderStatusEnum::CLOSED);
        $cajaActual = $this->crearCaja();
        $customer = $this->crearCliente();
        $viejo = $this->crearApartado($cajaVieja, $customer, 1000, 100);
        $this->crearApartado($cajaActual, $customer, 500, 50, estatus: OrderStatusEnum::CLOSED);

        $response = $this->getJson('/api/order?estatus_pedido_id='.OrderStatusEnum::LAYAWAY->value, $this->authHeaders())
            ->assertStatus(206);

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($viejo->id));
        $this->assertCount(1, $ids);

        $row = collect($response->json('data'))->firstWhere('id', $viejo->id);
        $this->assertEquals(100, $row['amount_paid']);
        $this->assertSame($customer->id, $row['customer']['id']);
        $this->assertNotNull($row['layaway_due_date']);
    }

    public function test_busqueda_en_el_tab_de_apartados_solo_encuentra_apartados(): void
    {
        $caja = $this->crearCaja();
        $customer = CustomerModel::create([
            CustomerModel::NAME => 'Maria Buscada',
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
        $apartado = $this->crearApartado($caja, $customer, 1000, 100);
        $this->crearApartado($caja, $customer, 500, 50, estatus: OrderStatusEnum::CLOSED);

        $response = $this->getJson('/api/order?search=Buscada&estatus_pedido_id='.OrderStatusEnum::LAYAWAY->value, $this->authHeaders())
            ->assertStatus(206);

        $this->assertSame([$apartado->id], collect($response->json('data'))->pluck('id')->all());
    }

    // ── Resumen ──────────────────────────────────────────────

    public function test_resumen_cuenta_activos_saldo_por_cobrar_y_vencidos(): void
    {
        $caja = $this->crearCaja();
        $customer = $this->crearCliente();
        $this->crearApartado($caja, $customer, 1000, 100);
        $this->crearApartado($caja, $customer, 2000, 500, Carbon::today()->subDays(3)->toDateString());
        $this->crearApartado($caja, $customer, 700, 70, Carbon::today()->addDays(5)->toDateString());
        // Liquidado y cancelado no cuentan como activos.
        $this->crearApartado($caja, $customer, 800, 800, estatus: OrderStatusEnum::CLOSED);
        $this->crearApartado($caja, $customer, 300, 0, estatus: OrderStatusEnum::CANCELED);

        $this->getJson('/api/order/layaways/summary', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.active_count', 3)
            ->assertJsonPath('data.pending_balance', 3030)
            ->assertJsonPath('data.overdue_count', 1)
            ->assertJsonPath('data.due_soon_count', 1);
    }

    public function test_resumen_sin_apartados_devuelve_ceros(): void
    {
        $this->getJson('/api/order/layaways/summary', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.active_count', 0)
            ->assertJsonPath('data.pending_balance', 0)
            ->assertJsonPath('data.overdue_count', 0)
            ->assertJsonPath('data.due_soon_count', 0);
    }

    public function test_resumen_se_acota_a_la_sucursal_pedida(): void
    {
        $tenantId = BusinessConfigModel::first()->id;
        $sucursalA = BranchModel::factory()->create([BranchModel::TENANT_ID => $tenantId]);
        $sucursalB = BranchModel::factory()->create([BranchModel::TENANT_ID => $tenantId]);
        $customer = $this->crearCliente();
        $this->crearApartado($this->crearCaja($sucursalA->id), $customer, 1000, 100);
        $this->crearApartado($this->crearCaja($sucursalB->id), $customer, 600, 100);

        $this->getJson("/api/order/layaways/summary?branch_id={$sucursalA->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.active_count', 1)
            ->assertJsonPath('data.pending_balance', 900);
    }

    public function test_resumen_exige_permiso_layaway_y_tenant_retail(): void
    {
        $empleado = User::factory()->create([
            User::ROL_ID => RoleEnum::EMPLOYE->value,
            User::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
        // Rol configurado con otro permiso, para no caer en el fallback a DEFAULTS.
        RolePermission::create([
            RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
            RolePermission::ROLE_ID => RoleEnum::EMPLOYE->value,
            RolePermission::PERMISSION_ID => Permission::where(Permission::KEY, 'viewOrders')->firstOrFail()->id,
        ]);

        $this->getJson('/api/order/layaways/summary', $this->authHeaders($empleado))->assertStatus(403);

        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante->value]);
        $this->getJson('/api/order/layaways/summary', $this->authHeaders())->assertStatus(403);
    }

    // ── Listado de clientes ──────────────────────────────────

    public function test_listado_de_clientes_indica_sus_apartados_activos_sin_tocar_el_adeudo(): void
    {
        $caja = $this->crearCaja();
        $conApartado = $this->crearCliente();
        $sinApartado = $this->crearCliente();
        $this->crearApartado($caja, $conApartado, 1000, 100);
        $this->crearApartado($caja, $conApartado, 400, 150);
        // Un apartado ya liquidado no cuenta como activo.
        $this->crearApartado($caja, $conApartado, 900, 900, estatus: OrderStatusEnum::CLOSED);

        $rows = collect($this->getJson('/api/customer', $this->authHeaders())->assertStatus(206)->json('data'));

        $row = $rows->firstWhere('id', $conApartado->id);
        $this->assertSame(2, $row['layaway_count']);
        $this->assertEquals(1400, $row['layaway_total']);
        $this->assertEquals(250, $row['layaway_paid']);
        $this->assertEquals(0, $row['balance']);

        $this->assertSame(0, $rows->firstWhere('id', $sinApartado->id)['layaway_count']);
    }

    public function test_listado_de_clientes_filtra_por_apartados_activos_y_vencidos(): void
    {
        $caja = $this->crearCaja();
        $vencido = $this->crearCliente();
        $alDia = $this->crearCliente();
        $liquidado = $this->crearCliente();
        $sinApartados = $this->crearCliente();
        $this->crearApartado($caja, $vencido, 1000, 100, Carbon::today()->subDays(2)->toDateString());
        $this->crearApartado($caja, $alDia, 800, 80);
        $this->crearApartado($caja, $liquidado, 500, 500, Carbon::today()->subDays(9)->toDateString(), OrderStatusEnum::CLOSED);

        $ids = fn (string $query) => collect($this->getJson("/api/customer{$query}", $this->authHeaders())->assertStatus(206)->json('data'))->pluck('id')->all();

        $this->assertEqualsCanonicalizing([$vencido->id, $alDia->id], $ids('?with_layaway=1'));
        $this->assertSame([$vencido->id], $ids('?layaway_overdue=1'));
        $this->assertContains($sinApartados->id, $ids(''));
        // El vencido solo cuenta apartados ACTIVOS: uno ya liquidado no marca al cliente.
        $this->assertNotContains($liquidado->id, $ids('?layaway_overdue=1'));

        $row = collect($this->getJson('/api/customer', $this->authHeaders())->json('data'))->firstWhere('id', $vencido->id);
        $this->assertSame(1, $row['layaway_overdue_count']);
        $this->assertSame(0, collect($this->getJson('/api/customer', $this->authHeaders())->json('data'))->firstWhere('id', $alDia->id)['layaway_overdue_count']);
    }

    // ── Detalle ──────────────────────────────────────────────

    public function test_detalle_de_orden_trae_el_historial_de_abonos_con_su_metodo_de_pago(): void
    {
        $order = $this->crearApartado($this->crearCaja(), $this->crearCliente(), 1000, 100);

        $this->getJson("/api/order/{$order->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.layaway_payments.0.amount', 100)
            ->assertJsonPath('data.layaway_payments.0.type', LayawayPaymentTypeEnum::Deposit->value)
            ->assertJsonPath('data.layaway_payments.0.payment_method.id', PaymentMethodModel::first()->id);
    }

    public function test_detalle_de_cliente_lista_sus_apartados_con_historial(): void
    {
        $caja = $this->crearCaja();
        $customer = $this->crearCliente();
        $otro = $this->crearCliente();
        $mio = $this->crearApartado($caja, $customer, 1000, 100);
        $this->crearApartado($caja, $otro, 700, 70);
        $camion = ProductModel::create([
            ProductModel::NOMBRE => 'Camión rojo',
            ProductModel::PRECIO => 500,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::PRODUCT_CODE => 'CAM01',
        ]);
        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $mio->id,
            OrderProductModel::PRODUCTO_ID => $camion->id,
            OrderProductModel::CANTIDAD => 2,
            OrderProductModel::PRECIO => 500,
            OrderProductModel::DESCUENTO => 0,
        ]);

        $response = $this->getJson("/api/customer/{$customer->id}", $this->authHeaders())
            ->assertStatus(200);

        $layaways = $response->json('data.layaway_orders');
        $this->assertCount(1, $layaways);
        $this->assertSame($mio->id, $layaways[0]['id']);
        $this->assertEquals(100, $layaways[0]['layaway_payments'][0]['amount']);
        // Qué se apartó: líneas de la orden con su producto.
        $this->assertCount(1, $layaways[0]['order_products']);
        $this->assertSame('Camión rojo', $layaways[0]['order_products'][0]['product']['nombre']);
        $this->assertSame('CAM01', $layaways[0]['order_products'][0]['product']['product_code']);
        $this->assertEquals(2, $layaways[0]['order_products'][0]['cantidad']);
        $this->assertNotNull($layaways[0]['layaway_payments'][0]['payment_method']);
    }
}
