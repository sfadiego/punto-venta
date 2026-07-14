<?php

namespace Tests\Orders;

use App\Enums\MainOrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderStatusModel;
use App\Models\ProductModel;
use App\Models\User;
use Tests\TestCase;

/**
 * Verifica que los totales de órdenes sean matemáticamente correctos.
 *
 * Fórmulas:
 *   línea_subtotal  = precio × cantidad × (1 − descuento_item / 100)
 *   orden_subtotal  = Σ línea_subtotal
 *   orden_total     = orden_subtotal × (1 − descuento_orden / 100)
 */
class OrderTotalsTest extends TestCase
{
    private function crearOrden(int $descuentoOrden = 0): OrderModel
    {
        $report = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        return OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Test Totales',
            OrderModel::TOTAL => 0,
            OrderModel::SUBTOTAL => 0,
            OrderModel::DESCUENTO => $descuentoOrden,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusModel::first()->id,
            OrderModel::SISTEMA_ID => $report->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearProducto(float $precio = 100): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE => "Producto $precio",
            ProductModel::PRECIO => $precio,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
        ]);
    }

    /** Añade un producto a la orden vía API y devuelve el item creado. */
    private function agregarProducto(int $ordenId, int $productoId, int $cantidad, float $precio, int $descuento = 0): void
    {
        $this->postJson("/api/order/{$ordenId}/product", [
            'producto_id' => $productoId,
            'cantidad' => $cantidad,
            'precio' => $precio,
            'descuento' => $descuento,
        ], $this->authHeaders())->assertStatus(200);
    }

    /** Obtiene el total y subtotal de la orden recalculados por el backend. */
    private function totalOrden(int $ordenId): array
    {
        $data = $this->getJson("/api/order/{$ordenId}", $this->authHeaders())
            ->assertStatus(200)
            ->json('data');

        return [
            'total' => (float) $data['total'],
            'subtotal' => (float) $data['subtotal'],
        ];
    }

    // ── Sin descuentos ────────────────────────────────────────

    public function test_total_un_producto_sin_descuento(): void
    {
        $orden = $this->crearOrden();
        $producto = $this->crearProducto(precio: 100);

        // precio=100, cantidad=2, descuento=0 → subtotal=200, total=200
        $this->agregarProducto($orden->id, $producto->id, 2, 100);

        $totales = $this->totalOrden($orden->id);

        $this->assertEquals(200.0, $totales['subtotal']);
        $this->assertEquals(200.0, $totales['total']);
    }

    public function test_total_varios_productos_sin_descuento(): void
    {
        $orden = $this->crearOrden();
        $prodA = $this->crearProducto(precio: 50);
        $prodB = $this->crearProducto(precio: 80);
        $prodC = $this->crearProducto(precio: 30);

        // A: 50×3 = 150 | B: 80×2 = 160 | C: 30×5 = 150 → total = 460
        $this->agregarProducto($orden->id, $prodA->id, 3, 50);
        $this->agregarProducto($orden->id, $prodB->id, 2, 80);
        $this->agregarProducto($orden->id, $prodC->id, 5, 30);

        $totales = $this->totalOrden($orden->id);

        $this->assertEquals(460.0, $totales['subtotal']);
        $this->assertEquals(460.0, $totales['total']);
    }

    // ── Descuento en producto ─────────────────────────────────

    public function test_total_con_descuento_en_producto(): void
    {
        $orden = $this->crearOrden();
        $producto = $this->crearProducto(precio: 100);

        // precio=100, cantidad=2, descuento=20% → subtotal = 100×2×0.8 = 160
        $this->agregarProducto($orden->id, $producto->id, 2, 100, 20);

        $totales = $this->totalOrden($orden->id);

        $this->assertEquals(160.0, $totales['subtotal']);
        $this->assertEquals(160.0, $totales['total']);
    }

    public function test_total_varios_productos_con_descuentos_distintos(): void
    {
        $orden = $this->crearOrden();
        $prodA = $this->crearProducto(precio: 200);
        $prodB = $this->crearProducto(precio: 100);

        // A: 200×1×(1−0.25) = 150  |  B: 100×3×(1−0.10) = 270  → total = 420
        $this->agregarProducto($orden->id, $prodA->id, 1, 200, 25);
        $this->agregarProducto($orden->id, $prodB->id, 3, 100, 10);

        $totales = $this->totalOrden($orden->id);

        $this->assertEquals(420.0, $totales['subtotal']);
        $this->assertEquals(420.0, $totales['total']);
    }

    // ── Descuento en la orden ─────────────────────────────────

    public function test_total_con_descuento_en_la_orden(): void
    {
        $orden = $this->crearOrden(descuentoOrden: 10);
        $producto = $this->crearProducto(precio: 100);

        // precio=100, cantidad=2, sin descuento item → subtotal=200
        // descuento orden=10% → total = 200×0.9 = 180
        $this->agregarProducto($orden->id, $producto->id, 2, 100);

        $totales = $this->totalOrden($orden->id);

        $this->assertEquals(200.0, $totales['subtotal']);
        $this->assertEquals(180.0, $totales['total']);
    }

    public function test_total_descuento_orden_50_porciento(): void
    {
        $orden = $this->crearOrden(descuentoOrden: 50);
        $producto = $this->crearProducto(precio: 80);

        // 80×5 = 400 → con 50% orden → total = 200
        $this->agregarProducto($orden->id, $producto->id, 5, 80);

        $totales = $this->totalOrden($orden->id);

        $this->assertEquals(400.0, $totales['subtotal']);
        $this->assertEquals(200.0, $totales['total']);
    }

    // ── Descuento en producto + descuento en orden ────────────

    public function test_total_descuento_producto_y_descuento_orden(): void
    {
        $orden = $this->crearOrden(descuentoOrden: 10);
        $producto = $this->crearProducto(precio: 100);

        // precio=100, cantidad=2, descuento item=25% → subtotal línea = 100×2×0.75 = 150
        // descuento orden=10% → total = 150×0.9 = 135
        $this->agregarProducto($orden->id, $producto->id, 2, 100, 25);

        $totales = $this->totalOrden($orden->id);

        $this->assertEquals(150.0, $totales['subtotal']);
        $this->assertEquals(135.0, $totales['total']);
    }

    public function test_total_multiples_productos_con_descuento_doble(): void
    {
        $orden = $this->crearOrden(descuentoOrden: 20);
        $prodA = $this->crearProducto(precio: 120);
        $prodB = $this->crearProducto(precio: 80);

        // A: 120×2×(1−0.10) = 216  |  B: 80×3×(1−0.15) = 204 → subtotal = 420
        // descuento orden=20% → total = 420×0.8 = 336
        $this->agregarProducto($orden->id, $prodA->id, 2, 120, 10);
        $this->agregarProducto($orden->id, $prodB->id, 3, 80, 15);

        $totales = $this->totalOrden($orden->id);

        $this->assertEquals(420.0, $totales['subtotal']);
        $this->assertEquals(336.0, $totales['total']);
    }

    // ── Actualización de cantidad ─────────────────────────────

    public function test_total_se_actualiza_al_cambiar_cantidad(): void
    {
        $orden = $this->crearOrden();
        $producto = $this->crearProducto(precio: 100);

        $this->agregarProducto($orden->id, $producto->id, 1, 100);

        // Antes: 100×1 = 100
        $antes = $this->totalOrden($orden->id);
        $this->assertEquals(100.0, $antes['total']);

        // Actualizar cantidad a 4 → 100×4 = 400
        $this->putJson("/api/order/{$orden->id}/product/{$producto->id}", [
            'cantidad' => 4,
        ], $this->authHeaders())->assertStatus(200);

        $despues = $this->totalOrden($orden->id);
        $this->assertEquals(400.0, $despues['subtotal']);
        $this->assertEquals(400.0, $despues['total']);
    }

    public function test_total_se_actualiza_al_cambiar_descuento_del_producto(): void
    {
        $orden = $this->crearOrden();
        $producto = $this->crearProducto(precio: 100);

        // Añadir sin descuento: 100×2 = 200
        $this->agregarProducto($orden->id, $producto->id, 2, 100, 0);

        $antes = $this->totalOrden($orden->id);
        $this->assertEquals(200.0, $antes['total']);

        // Aplicar 50% de descuento al item → 100×2×0.5 = 100
        $this->putJson("/api/order/{$orden->id}/product/{$producto->id}", [
            'descuento' => 50,
        ], $this->authHeaders())->assertStatus(200);

        $despues = $this->totalOrden($orden->id);
        $this->assertEquals(100.0, $despues['subtotal']);
        $this->assertEquals(100.0, $despues['total']);
    }

    // ── Eliminación de productos ──────────────────────────────

    public function test_total_se_reduce_al_eliminar_producto(): void
    {
        $orden = $this->crearOrden();
        $prodA = $this->crearProducto(precio: 100);
        $prodB = $this->crearProducto(precio: 50);

        $this->agregarProducto($orden->id, $prodA->id, 2, 100); // 200
        $this->agregarProducto($orden->id, $prodB->id, 3, 50);  // 150 → subtotal = 350

        $this->deleteJson("/api/order/{$orden->id}/product/{$prodA->id}", [], $this->authHeaders())
            ->assertStatus(200);

        // Sólo queda prodB: 150
        $totales = $this->totalOrden($orden->id);
        $this->assertEquals(150.0, $totales['subtotal']);
        $this->assertEquals(150.0, $totales['total']);
    }

    public function test_total_con_descuento_orden_se_reduce_al_eliminar_producto(): void
    {
        $orden = $this->crearOrden(descuentoOrden: 10);
        $prodA = $this->crearProducto(precio: 200);
        $prodB = $this->crearProducto(precio: 100);

        $this->agregarProducto($orden->id, $prodA->id, 1, 200); // 200
        $this->agregarProducto($orden->id, $prodB->id, 2, 100); // 200 → subtotal = 400 → total = 360

        $this->deleteJson("/api/order/{$orden->id}/product/{$prodA->id}", [], $this->authHeaders())
            ->assertStatus(200);

        // Sólo queda prodB: subtotal=200, total=200×0.9=180
        $totales = $this->totalOrden($orden->id);
        $this->assertEquals(200.0, $totales['subtotal']);
        $this->assertEquals(180.0, $totales['total']);
    }

    // ── Total no puede ser negativo ───────────────────────────

    public function test_total_no_es_negativo_al_eliminar_mas_de_lo_guardado(): void
    {
        $orden = $this->crearOrden();
        $producto = $this->crearProducto(precio: 50);

        $this->agregarProducto($orden->id, $producto->id, 1, 50);

        // Forzamos subtotal a 0 en la DB antes de eliminar (simula descuadre)
        OrderModel::where('id', $orden->id)->update(['subtotal' => 0, 'total' => 0]);

        $this->deleteJson("/api/order/{$orden->id}/product/{$producto->id}", [], $this->authHeaders())
            ->assertStatus(200);

        $orden->refresh();
        $this->assertGreaterThanOrEqual(0, $orden->total);
        $this->assertGreaterThanOrEqual(0, $orden->subtotal);
    }
}
