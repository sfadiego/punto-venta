<?php

namespace Tests\System;

use App\Enums\BusinessTypeEnum;
use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BranchModel;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\CustomerModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\PaymentMethodModel;
use App\Models\ProductModel;
use App\Models\User;
use Tests\TestCase;

/**
 * Cuadre de caja con apartados: cada sesión cuenta solo el dinero abonado/reembolsado en ella
 * (no el total de la orden), de modo que un apartado abonado un día y liquidado otro no duplica
 * ni descuadra el efectivo de ninguna de las dos cajas.
 */
class CloseSalesLayawayTest extends TestCase
{
    private PaymentMethodModel $efectivo;

    private PaymentMethodModel $tarjeta;

    private CustomerModel $customer;

    protected function setUp(): void
    {
        parent::setUp();

        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value]);

        $this->efectivo = PaymentMethodModel::create([PaymentMethodModel::NAME => 'Efectivo', PaymentMethodModel::ACTIVE => true]);
        $this->tarjeta = PaymentMethodModel::create([PaymentMethodModel::NAME => 'Tarjeta', PaymentMethodModel::ACTIVE => true]);
        $this->customer = CustomerModel::create([
            CustomerModel::NAME => 'Cliente Apartado',
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearCaja(float $inicio = 0, ?int $branchId = null): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => $inicio,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
            MainOrderReportModel::BRANCH_ID => $branchId,
        ]);
    }

    private function crearVentaCerrada(MainOrderReportModel $caja, float $total, PaymentMethodModel $metodo): OrderModel
    {
        return OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Venta normal',
            OrderModel::TOTAL => $total,
            OrderModel::SUBTOTAL => $total,
            OrderModel::DESCUENTO => 0,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            OrderModel::PAYMENT_METHOD_ID => $metodo->id,
            OrderModel::SISTEMA_ID => $caja->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearOrdenEnProceso(MainOrderReportModel $caja, float $total): OrderModel
    {
        $order = OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Venta apartado',
            OrderModel::TOTAL => $total,
            OrderModel::SUBTOTAL => $total,
            OrderModel::DESCUENTO => 0,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS->value,
            OrderModel::SISTEMA_ID => $caja->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        $product = ProductModel::create([
            ProductModel::NOMBRE => 'Juguete '.uniqid(),
            ProductModel::PRECIO => $total,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
        ]);

        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $order->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => $total,
            OrderProductModel::DESCUENTO => 0,
        ]);

        return $order;
    }

    private function apartar(OrderModel $order, MainOrderReportModel $caja, float $anticipo, PaymentMethodModel $metodo): void
    {
        $this->postJson("/api/order/{$order->id}/layaway", [
            'customer_id' => $this->customer->id,
            'amount' => $anticipo,
            'payment_method_id' => $metodo->id,
            'sistema_id' => $caja->id,
        ], $this->authHeaders())->assertStatus(200);
    }

    private function abonar(OrderModel $order, MainOrderReportModel $caja, float $monto, PaymentMethodModel $metodo)
    {
        return $this->postJson("/api/order/{$order->id}/layaway/payment", [
            'amount' => $monto,
            'payment_method_id' => $metodo->id,
            'sistema_id' => $caja->id,
        ], $this->authHeaders());
    }

    private function totales(MainOrderReportModel $caja)
    {
        return $this->getJson("/api/admin/system/{$caja->id}/total-current-sales", $this->authHeaders())
            ->assertStatus(200);
    }

    private function totalDeMetodo(array $byMethod, PaymentMethodModel $metodo): float
    {
        return (float) collect($byMethod)->firstWhere('payment_method_id', $metodo->id)['total'];
    }

    public function test_el_anticipo_suma_a_la_caja_donde_se_recibio_sin_contar_el_total_de_la_orden(): void
    {
        $caja = $this->crearCaja();
        $this->crearVentaCerrada($caja, 500, $this->efectivo);
        $this->apartar($this->crearOrdenEnProceso($caja, 1000), $caja, 100, $this->tarjeta);

        $response = $this->totales($caja)
            ->assertJsonPath('data.bruto', 600)
            ->assertJsonPath('data.apartados.abonos', 100)
            ->assertJsonPath('data.apartados.reembolsos', 0)
            ->assertJsonPath('data.apartados.neto', 100);

        $byMethod = $response->json('data.by_payment_method');
        $this->assertEquals(500, $this->totalDeMetodo($byMethod, $this->efectivo));
        $this->assertEquals(100, $this->totalDeMetodo($byMethod, $this->tarjeta));
    }

    public function test_abono_un_dia_y_liquidacion_otro_no_duplican_el_dinero(): void
    {
        $cajaA = $this->crearCaja();
        $order = $this->crearOrdenEnProceso($cajaA, 1000);
        $this->apartar($order, $cajaA, 100, $this->efectivo);

        $this->postJson("/api/admin/system/{$cajaA->id}/close", [], $this->authHeaders())->assertStatus(200);
        $cajaA->refresh();
        $this->assertEquals(100, (float) $cajaA->venta_dia);
        $this->assertEquals(100, (float) $cajaA->efectivo_caja_cierre);

        $cajaB = $this->crearCaja();
        $this->abonar($order, $cajaB, 300, $this->efectivo)->assertStatus(200);
        $this->abonar($order, $cajaB, 600, $this->tarjeta)->assertStatus(200)
            ->assertJsonPath('data.estatus_pedido_id', OrderStatusEnum::CLOSED->value);

        // La caja B recibió 900, no los 1000 de la orden.
        $response = $this->totales($cajaB)->assertJsonPath('data.bruto', 900);
        $byMethod = $response->json('data.by_payment_method');
        $this->assertEquals(300, $this->totalDeMetodo($byMethod, $this->efectivo));
        $this->assertEquals(600, $this->totalDeMetodo($byMethod, $this->tarjeta));

        // La venta cerrada pasa a la sesión donde se liquidó; la caja A ya cerrada conserva su corte.
        $this->assertSame($cajaB->id, $order->fresh()->sistema_id);
        $this->assertEquals(100, (float) $cajaA->fresh()->venta_dia);
        $this->assertEquals(100, $cajaA->fresh()->totalSalesByDay());
    }

    public function test_reembolso_de_cancelacion_resta_en_la_caja_donde_se_devuelve(): void
    {
        $cajaA = $this->crearCaja();
        $order = $this->crearOrdenEnProceso($cajaA, 1000);
        $this->apartar($order, $cajaA, 150, $this->efectivo);

        $cajaB = $this->crearCaja();
        $this->postJson("/api/order/{$order->id}/layaway/cancel", ['sistema_id' => $cajaB->id], $this->authHeaders())
            ->assertStatus(200);

        $response = $this->totales($cajaB)
            ->assertJsonPath('data.bruto', -150)
            ->assertJsonPath('data.apartados.reembolsos', 150)
            ->assertJsonPath('data.apartados.neto', -150);
        $this->assertEquals(-150, $this->totalDeMetodo($response->json('data.by_payment_method'), $this->efectivo));
    }

    public function test_apartado_activo_no_bloquea_el_cierre_y_una_caja_solo_con_abonos_puede_cerrarse(): void
    {
        $caja = $this->crearCaja(inicio: 200);
        $this->apartar($this->crearOrdenEnProceso($caja, 1000), $caja, 100, $this->efectivo);

        $this->postJson("/api/admin/system/{$caja->id}/close", [], $this->authHeaders())->assertStatus(200);

        $this->assertEquals(300, (float) $caja->fresh()->efectivo_caja_cierre);
    }

    public function test_una_caja_sin_ventas_ni_movimientos_de_apartados_sigue_sin_poder_cerrarse(): void
    {
        $caja = $this->crearCaja();

        $this->postJson("/api/admin/system/{$caja->id}/close", [], $this->authHeaders())->assertStatus(422);
    }

    public function test_el_dinero_de_un_apartado_no_puede_moverse_en_una_caja_de_otra_sucursal(): void
    {
        $sucursalA = BranchModel::factory()->create([BranchModel::TENANT_ID => BusinessConfigModel::first()->id]);
        $sucursalB = BranchModel::factory()->create([BranchModel::TENANT_ID => BusinessConfigModel::first()->id]);
        $cajaA = $this->crearCaja(branchId: $sucursalA->id);
        $cajaB = $this->crearCaja(branchId: $sucursalB->id);
        $order = $this->crearOrdenEnProceso($cajaA, 1000);

        // Anticipo en la caja de otra sucursal
        $this->postJson("/api/order/{$order->id}/layaway", [
            'customer_id' => $this->customer->id,
            'amount' => 100,
            'payment_method_id' => $this->efectivo->id,
            'sistema_id' => $cajaB->id,
        ], $this->authHeaders())->assertStatus(422);

        $this->apartar($order, $cajaA, 100, $this->efectivo);

        $this->abonar($order, $cajaB, 100, $this->efectivo)->assertStatus(422);
        $this->postJson("/api/order/{$order->id}/layaway/cancel", ['sistema_id' => $cajaB->id], $this->authHeaders())
            ->assertStatus(422);
    }
}
