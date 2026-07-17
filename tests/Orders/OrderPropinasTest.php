<?php

namespace Tests\Orders;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
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
 * Verifica que las propinas se almacenen correctamente en las órdenes
 * y no afecten el total de venta.
 *
 * Reglas:
 *   - order.propina  = monto de propina capturado en el cobro
 *   - order.total    = precio de venta (NO incluye propina)
 *   - La propina se guarda separada para reportes de corte de caja
 */
class OrderPropinasTest extends TestCase
{
    private function crearCaja(): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA     => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID          => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID        => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearOrden(int $cajaId, int $descuento = 0): OrderModel
    {
        return OrderModel::create([
            OrderModel::NOMBRE_PEDIDO     => 'Test Propina',
            OrderModel::TOTAL             => 0,
            OrderModel::SUBTOTAL          => 0,
            OrderModel::DESCUENTO         => $descuento,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusModel::first()->id,
            OrderModel::SISTEMA_ID        => $cajaId,
            OrderModel::TENANT_ID         => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearProducto(float $precio = 100): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE      => "Producto $precio",
            ProductModel::PRECIO      => $precio,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO      => true,
        ]);
    }

    private function crearMetodoPago(string $nombre): PaymentMethodModel
    {
        return PaymentMethodModel::create([
            PaymentMethodModel::NAME      => $nombre,
            PaymentMethodModel::ACTIVE    => true,
            PaymentMethodModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function agregarProducto(int $ordenId, int $productoId, int $cantidad, float $precio, int $descuento = 0): void
    {
        $this->postJson("/api/order/{$ordenId}/product", [
            'producto_id' => $productoId,
            'cantidad'    => $cantidad,
            'precio'      => $precio,
            'descuento'   => $descuento,
        ], $this->authHeaders())->assertStatus(200);
    }

    // ── Valor por defecto ─────────────────────────────────────

    public function test_propina_default_es_cero(): void
    {
        $caja  = $this->crearCaja();
        $orden = $this->crearOrden($caja->id);

        $data = $this->getJson("/api/order/{$orden->id}", $this->authHeaders())
            ->assertStatus(200)
            ->json('data');

        $this->assertEquals(0.0, (float) $data['propina']);
    }

    // ── Guardar propina en actualización ──────────────────────

    public function test_propina_se_guarda_al_cerrar_orden(): void
    {
        $caja    = $this->crearCaja();
        $orden   = $this->crearOrden($caja->id);
        $metodo  = $this->crearMetodoPago('Transferencia');
        $producto = $this->crearProducto(200);

        $this->agregarProducto($orden->id, $producto->id, 1, 200);

        $this->putJson("/api/order/{$orden->id}", [
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            OrderModel::PAYMENT_METHOD_ID => $metodo->id,
            OrderModel::PROPINA           => 30.00,
        ], $this->authHeaders())->assertStatus(200);

        $this->assertDatabaseHas('order', [
            'id'     => $orden->id,
            'propina' => 30.00,
        ]);
    }

    public function test_propina_con_metodo_efectivo(): void
    {
        $caja    = $this->crearCaja();
        $orden   = $this->crearOrden($caja->id);
        $metodo  = $this->crearMetodoPago('Efectivo');
        $producto = $this->crearProducto(100);

        $this->agregarProducto($orden->id, $producto->id, 2, 100);

        $response = $this->putJson("/api/order/{$orden->id}", [
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            OrderModel::PAYMENT_METHOD_ID => $metodo->id,
            OrderModel::PROPINA           => 20.00,
        ], $this->authHeaders())->assertStatus(200);

        $this->assertEquals(20.00, (float) $response->json('data.propina'));
    }

    // ── Propina no afecta el total ────────────────────────────

    public function test_propina_no_se_incluye_en_total_de_orden(): void
    {
        $caja    = $this->crearCaja();
        $orden   = $this->crearOrden($caja->id);
        $metodo  = $this->crearMetodoPago('Transferencia');
        $producto = $this->crearProducto(100);

        // precio=100, cantidad=2 → total esperado = 200 (la propina no lo cambia)
        $this->agregarProducto($orden->id, $producto->id, 2, 100);

        $this->putJson("/api/order/{$orden->id}", [
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            OrderModel::PAYMENT_METHOD_ID => $metodo->id,
            OrderModel::PROPINA           => 50.00,
        ], $this->authHeaders())->assertStatus(200);

        $data = $this->getJson("/api/order/{$orden->id}", $this->authHeaders())
            ->assertStatus(200)
            ->json('data');

        $this->assertEquals(200.0, (float) $data['total']);
        $this->assertEquals(50.0,  (float) $data['propina']);
    }

    public function test_propina_no_afecta_total_con_descuento_orden(): void
    {
        $caja    = $this->crearCaja();
        $orden   = $this->crearOrden($caja->id, descuento: 10);
        $metodo  = $this->crearMetodoPago('Tarjeta');
        $producto = $this->crearProducto(100);

        // precio=100, cantidad=2, descuento orden=10% → total = 180
        $this->agregarProducto($orden->id, $producto->id, 2, 100);

        $this->putJson("/api/order/{$orden->id}", [
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            OrderModel::PAYMENT_METHOD_ID => $metodo->id,
            OrderModel::PROPINA           => 25.00,
        ], $this->authHeaders())->assertStatus(200);

        $data = $this->getJson("/api/order/{$orden->id}", $this->authHeaders())
            ->assertStatus(200)
            ->json('data');

        $this->assertEquals(180.0, (float) $data['total']);
        $this->assertEquals(25.0,  (float) $data['propina']);
    }

    // ── Validación ───────────────────────────────────────────

    public function test_propina_negativa_falla_validacion(): void
    {
        $caja  = $this->crearCaja();
        $orden = $this->crearOrden($caja->id);

        $this->putJson("/api/order/{$orden->id}", [
            OrderModel::PROPINA => -10,
        ], $this->authHeaders())->assertStatus(400);
    }

    public function test_propina_cero_es_valida(): void
    {
        $caja  = $this->crearCaja();
        $orden = $this->crearOrden($caja->id);

        $this->putJson("/api/order/{$orden->id}", [
            OrderModel::PROPINA => 0,
        ], $this->authHeaders())->assertStatus(200);
    }

    public function test_propina_decimal_es_valida(): void
    {
        $caja   = $this->crearCaja();
        $orden  = $this->crearOrden($caja->id);
        $metodo = $this->crearMetodoPago('Transferencia');

        $response = $this->putJson("/api/order/{$orden->id}", [
            OrderModel::PAYMENT_METHOD_ID => $metodo->id,
            OrderModel::PROPINA           => 15.50,
        ], $this->authHeaders())->assertStatus(200);

        $this->assertEquals(15.50, (float) $response->json('data.propina'));
    }

    // ── Campo presente en respuesta show ─────────────────────

    public function test_show_orden_incluye_campo_propina(): void
    {
        $caja  = $this->crearCaja();
        $orden = $this->crearOrden($caja->id);

        $this->getJson("/api/order/{$orden->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['id', 'total', 'subtotal', 'propina']]);
    }
}
