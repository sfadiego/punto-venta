<?php

namespace Tests\Orders;

use App\Enums\BusinessTypeEnum;
use App\Enums\LayawayPaymentTypeEnum;
use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Enums\StockMovementReasonEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\CustomerModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderLayawayPaymentModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\PaymentMethodModel;
use App\Models\ProductModel;
use App\Models\StockMovementModel;
use App\Models\User;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * Apartados (retail): anticipo al crear (descuenta stock), abonos hasta liquidar (cierra la venta
 * sin volver a descontar) y cancelación (restituye stock y reembolsa lo abonado).
 */
class LayawayTest extends TestCase
{
    private MainOrderReportModel $caja;

    protected function setUp(): void
    {
        parent::setUp();

        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value,
            BusinessConfigModel::STOCK_ENABLED => true,
        ]);

        $this->caja = $this->crearCaja();
    }

    private function crearCaja(MainOrderStatusEnum $estatus = MainOrderStatusEnum::OPEN): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => $estatus,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearCliente(): CustomerModel
    {
        return CustomerModel::create([
            CustomerModel::NAME => 'Cliente Apartado '.uniqid(),
            CustomerModel::PHONE => '5512345678',
            CustomerModel::ALLOW_CREDIT => false,
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    /** Orden InProcess con un producto de $1,000 x 1 (total 1000) y stock inicial 10. */
    private function crearOrden(float $precio = 1000, float $cantidad = 1, float $stock = 10): array
    {
        $order = OrderModel::create([
            OrderModel::TOTAL => $precio * $cantidad,
            OrderModel::SUBTOTAL => $precio * $cantidad,
            OrderModel::DESCUENTO => 0,
            OrderModel::NOMBRE_PEDIDO => 'Venta apartado',
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS->value,
            OrderModel::SISTEMA_ID => $this->caja->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        $product = ProductModel::create([
            ProductModel::NOMBRE => 'Juguete grande',
            ProductModel::PRECIO => $precio,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::MANAGE_STOCK => true,
            ProductModel::STOCK => $stock,
        ]);

        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $order->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => $cantidad,
            OrderProductModel::PRECIO => $precio,
            OrderProductModel::DESCUENTO => 0,
        ]);

        return [$order, $product];
    }

    private function payload(CustomerModel $customer, float $amount, array $extra = []): array
    {
        return array_merge([
            'customer_id' => $customer->id,
            'amount' => $amount,
            'payment_method_id' => PaymentMethodModel::first()->id,
            'sistema_id' => $this->caja->id,
        ], $extra);
    }

    private function abono(float $amount, array $extra = []): array
    {
        return array_merge([
            'amount' => $amount,
            'payment_method_id' => PaymentMethodModel::first()->id,
            'sistema_id' => $this->caja->id,
        ], $extra);
    }

    // ── Crear apartado ───────────────────────────────────────

    public function test_crear_apartado_registra_anticipo_descuenta_stock_y_fija_fecha_limite(): void
    {
        [$order, $product] = $this->crearOrden();
        $customer = $this->crearCliente();

        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($customer, 100), $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.estatus_pedido_id', OrderStatusEnum::LAYAWAY->value)
            ->assertJsonPath('data.customer_id', $customer->id)
            ->assertJsonPath('data.amount_paid', 100)
            ->assertJsonPath('data.layaway_due_date', Carbon::today()->addDays(30)->toDateString())
            ->assertJsonPath('data.layaway_payments.0.amount', 100)
            ->assertJsonPath('data.layaway_payments.0.type', LayawayPaymentTypeEnum::Deposit->value);

        $this->assertEquals(9.0, (float) $product->fresh()->stock);
        $this->assertDatabaseHas('stock_movements', [
            StockMovementModel::PRODUCT_ID => $product->id,
            StockMovementModel::REASON => StockMovementReasonEnum::Layaway->value,
        ]);

        $payment = OrderLayawayPaymentModel::where(OrderLayawayPaymentModel::ORDER_ID, $order->id)->firstOrFail();
        $this->assertSame($this->caja->id, $payment->sistema_id);
        $this->assertNotNull($payment->created_by);
    }

    public function test_dias_del_apartado_son_configurables(): void
    {
        BusinessConfigModel::first()->update([BusinessConfigModel::LAYAWAY_DAYS => 15]);
        [$order] = $this->crearOrden();

        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($this->crearCliente(), 100), $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.layaway_due_date', Carbon::today()->addDays(15)->toDateString());
    }

    public function test_fecha_limite_enviada_tiene_prioridad(): void
    {
        $due = Carbon::today()->addDays(7)->toDateString();
        [$order] = $this->crearOrden();

        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($this->crearCliente(), 100, ['due_date' => $due]), $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.layaway_due_date', $due);
    }

    public function test_anticipo_menor_al_minimo_por_defecto_es_rechazado(): void
    {
        [$order, $product] = $this->crearOrden();

        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($this->crearCliente(), 99), $this->authHeaders())
            ->assertStatus(422);

        $this->assertSame(OrderStatusEnum::IN_PROCESS->value, $order->fresh()->estatus_pedido_id);
        $this->assertEquals(10.0, (float) $product->fresh()->stock);
        $this->assertSame(0, OrderLayawayPaymentModel::count());
    }

    public function test_porcentaje_minimo_es_configurable(): void
    {
        BusinessConfigModel::first()->update([BusinessConfigModel::LAYAWAY_MIN_PERCENT => 20]);
        [$order] = $this->crearOrden();
        $customer = $this->crearCliente();

        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($customer, 150), $this->authHeaders())
            ->assertStatus(422);

        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($customer, 200), $this->authHeaders())
            ->assertStatus(200);
    }

    public function test_anticipo_igual_o_mayor_al_total_es_rechazado(): void
    {
        [$order] = $this->crearOrden();

        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($this->crearCliente(), 1000), $this->authHeaders())
            ->assertStatus(422);
    }

    public function test_apartado_sin_stock_suficiente_no_cambia_nada(): void
    {
        [$order, $product] = $this->crearOrden(precio: 1000, cantidad: 3, stock: 2);

        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($this->crearCliente(), 300), $this->authHeaders())
            ->assertStatus(422);

        $this->assertSame(OrderStatusEnum::IN_PROCESS->value, $order->fresh()->estatus_pedido_id);
        $this->assertEquals(2.0, (float) $product->fresh()->stock);
        $this->assertSame(0, OrderLayawayPaymentModel::count());
    }

    public function test_caja_cerrada_no_puede_recibir_el_anticipo(): void
    {
        [$order] = $this->crearOrden();
        $cerrada = $this->crearCaja(MainOrderStatusEnum::CLOSED);

        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($this->crearCliente(), 100, ['sistema_id' => $cerrada->id]), $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_cliente_es_obligatorio(): void
    {
        [$order] = $this->crearOrden();

        $this->postJson("/api/order/{$order->id}/layaway", [
            'amount' => 100,
            'payment_method_id' => PaymentMethodModel::first()->id,
            'sistema_id' => $this->caja->id,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_una_orden_ya_apartada_no_se_puede_apartar_otra_vez(): void
    {
        [$order] = $this->crearOrden();
        $customer = $this->crearCliente();

        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($customer, 100), $this->authHeaders())->assertStatus(200);
        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($customer, 100), $this->authHeaders())->assertStatus(422);

        $this->assertSame(1, OrderLayawayPaymentModel::count());
    }

    // ── Abonos y liquidación ─────────────────────────────────

    public function test_abono_parcial_suma_al_total_abonado_sin_cerrar(): void
    {
        [$order, $product] = $this->crearOrden();
        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($this->crearCliente(), 100), $this->authHeaders())->assertStatus(200);

        $this->postJson("/api/order/{$order->id}/layaway/payment", $this->abono(300), $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.estatus_pedido_id', OrderStatusEnum::LAYAWAY->value)
            ->assertJsonPath('data.amount_paid', 400);

        $this->assertSame(2, OrderLayawayPaymentModel::where(OrderLayawayPaymentModel::ORDER_ID, $order->id)->count());
        $this->assertEquals(9.0, (float) $product->fresh()->stock);
    }

    public function test_abono_mayor_al_saldo_pendiente_es_rechazado(): void
    {
        [$order] = $this->crearOrden();
        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($this->crearCliente(), 100), $this->authHeaders())->assertStatus(200);

        $this->postJson("/api/order/{$order->id}/layaway/payment", $this->abono(901), $this->authHeaders())
            ->assertStatus(422);

        $this->assertEquals(100, (float) $order->fresh()->amount_paid);
    }

    public function test_abono_que_cubre_el_saldo_liquida_y_cierra_sin_descontar_stock_otra_vez(): void
    {
        [$order, $product] = $this->crearOrden();
        $methodId = PaymentMethodModel::first()->id;
        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($this->crearCliente(), 100), $this->authHeaders())->assertStatus(200);

        $this->postJson("/api/order/{$order->id}/layaway/payment", $this->abono(900), $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.estatus_pedido_id', OrderStatusEnum::CLOSED->value)
            ->assertJsonPath('data.amount_paid', 1000)
            ->assertJsonPath('data.payment_method_id', $methodId);

        // Stock descontado una sola vez (al crear el apartado).
        $this->assertEquals(9.0, (float) $product->fresh()->stock);
        $this->assertSame(1, StockMovementModel::where('product_id', $product->id)->count());
    }

    public function test_no_se_puede_abonar_a_una_orden_que_no_es_apartado(): void
    {
        [$order] = $this->crearOrden();

        $this->postJson("/api/order/{$order->id}/layaway/payment", $this->abono(100), $this->authHeaders())
            ->assertStatus(422);
    }

    // ── Cancelación ──────────────────────────────────────────

    public function test_cancelar_devuelve_stock_y_reembolsa_lo_abonado(): void
    {
        [$order, $product] = $this->crearOrden();
        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($this->crearCliente(), 100), $this->authHeaders())->assertStatus(200);
        $this->postJson("/api/order/{$order->id}/layaway/payment", $this->abono(200), $this->authHeaders())->assertStatus(200);

        $this->postJson("/api/order/{$order->id}/layaway/cancel", ['sistema_id' => $this->caja->id], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.estatus_pedido_id', OrderStatusEnum::CANCELED->value)
            ->assertJsonPath('data.amount_paid', 0);

        $this->assertEquals(10.0, (float) $product->fresh()->stock);
        $this->assertDatabaseHas('stock_movements', [
            StockMovementModel::PRODUCT_ID => $product->id,
            StockMovementModel::REASON => StockMovementReasonEnum::LayawayCancel->value,
        ]);

        $refund = OrderLayawayPaymentModel::where(OrderLayawayPaymentModel::ORDER_ID, $order->id)
            ->where(OrderLayawayPaymentModel::TYPE, LayawayPaymentTypeEnum::Refund->value)
            ->firstOrFail();
        $this->assertEquals(300, $refund->amount);
        $this->assertSame($this->caja->id, $refund->sistema_id);
    }

    public function test_no_se_puede_cancelar_un_apartado_ya_liquidado(): void
    {
        [$order] = $this->crearOrden();
        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($this->crearCliente(), 100), $this->authHeaders())->assertStatus(200);
        $this->postJson("/api/order/{$order->id}/layaway/payment", $this->abono(900), $this->authHeaders())->assertStatus(200);

        $this->postJson("/api/order/{$order->id}/layaway/cancel", ['sistema_id' => $this->caja->id], $this->authHeaders())
            ->assertStatus(422);
    }

    // ── Guards sobre un apartado ─────────────────────────────

    public function test_apartado_no_se_cierra_por_el_put_de_la_orden(): void
    {
        [$order, $product] = $this->crearOrden();
        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($this->crearCliente(), 100), $this->authHeaders())->assertStatus(200);

        $this->putJson("/api/order/{$order->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
            'payment_method_id' => PaymentMethodModel::first()->id,
        ], $this->authHeaders())
            ->assertStatus(400);

        $this->assertSame(OrderStatusEnum::LAYAWAY->value, $order->fresh()->estatus_pedido_id);
        $this->assertEquals(9.0, (float) $product->fresh()->stock);
    }

    public function test_apartado_no_se_puede_eliminar(): void
    {
        [$order] = $this->crearOrden();
        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($this->crearCliente(), 100), $this->authHeaders())->assertStatus(200);

        $this->deleteJson("/api/order/{$order->id}", [], $this->authHeaders())->assertStatus(422);

        $this->assertNotNull(OrderModel::find($order->id));
    }

    public function test_no_se_pueden_agregar_productos_a_un_apartado(): void
    {
        [$order] = $this->crearOrden();
        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($this->crearCliente(), 100), $this->authHeaders())->assertStatus(200);

        $this->postJson("/api/order/{$order->id}/product", [
            'nombre_extra' => 'Extra',
            'cantidad' => 1,
            'precio' => 10,
        ], $this->authHeaders())->assertStatus(422);
    }

    // ── Solo retail ──────────────────────────────────────────

    public function test_tenant_que_no_es_retail_no_puede_usar_apartados(): void
    {
        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante->value]);
        [$order] = $this->crearOrden();

        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($this->crearCliente(), 100), $this->authHeaders())
            ->assertStatus(403);
    }

    // ── Configuración del negocio ────────────────────────────

    public function test_admin_configura_porcentaje_y_dias_desde_el_panel(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->putJson('/api/admin/config', [
            'business_name' => $tenant->business_name,
            'primary_color' => '#112233',
            'sidebar_color' => '#112233',
            'font_color' => '#112233',
            'label_color' => '#112233',
            'layaway_min_percent' => 25,
            'layaway_days' => 45,
        ], $this->authHeaders())->assertStatus(200);

        $tenant->refresh();
        $this->assertEquals(25.0, $tenant->layaway_min_percent);
        $this->assertSame(45, $tenant->layaway_days);
    }
}
