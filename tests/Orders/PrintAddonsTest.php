<?php

namespace Tests\Orders;

use App\Enums\UnidadMedidaEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductAddonModel;
use App\Models\OrderProductModel;
use App\Models\ProductModel;
use Tests\TestCase;

/**
 * Ticket impreso con toppings (fase 4): el precio por unidad de la línea ya los incluye, cada
 * topping se lista debajo con su aporte y el descuento se calcula sobre el total con toppings.
 */
class PrintAddonsTest extends TestCase
{
    private function crearLinea(float $cantidad = 2, float $descuento = 0, float $precio = 45): OrderProductModel
    {
        $caja = MainOrderReportModel::factory()->create([
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
        $orden = OrderModel::factory()->create([
            OrderModel::SISTEMA_ID => $caja->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
        $producto = ProductModel::factory()->create([
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::PRECIO => $precio,
            ProductModel::UNIDAD_MEDIDA => UnidadMedidaEnum::Unidad,
        ]);

        return OrderProductModel::factory()->create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $producto->id,
            OrderProductModel::CANTIDAD => $cantidad,
            OrderProductModel::PRECIO => $precio,
            OrderProductModel::DESCUENTO => $descuento,
        ]);
    }

    private function agregarTopping(OrderProductModel $linea, string $nombre, float $precio, int $cantidad = 1): void
    {
        OrderProductAddonModel::create([
            OrderProductAddonModel::ORDER_PRODUCT_ID => $linea->id,
            OrderProductAddonModel::NAME => $nombre,
            OrderProductAddonModel::PRICE => $precio,
            OrderProductAddonModel::QUANTITY => $cantidad,
            OrderProductAddonModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function ticket(OrderProductModel $linea): string
    {
        return $this->get(
            "/api/order/{$linea->pedido_id}/print/bytes",
            array_merge($this->authHeaders(), ['Accept' => '*/*'])
        )->assertStatus(200)->getContent();
    }

    public function test_el_ticket_lista_los_toppings_y_usa_el_precio_unitario_con_toppings(): void
    {
        $linea = $this->crearLinea(cantidad: 2);
        $this->agregarTopping($linea, 'Nieve', 20, 1);
        $this->agregarTopping($linea, 'Chocolate', 10, 2);

        $contenido = $this->ticket($linea);

        // Unitario: 45 + 20×1 + 10×2 = 85 → 2 x $85, total de línea $170.
        $this->assertStringContainsString('2 x $85', $contenido);
        $this->assertStringContainsString('$170', $contenido);
        $this->assertStringContainsString('+ Nieve', $contenido);
        $this->assertStringContainsString('+$20', $contenido);
        $this->assertStringContainsString('+ Chocolate x2', $contenido);
    }

    public function test_un_topping_sin_costo_no_imprime_monto(): void
    {
        $linea = $this->crearLinea(cantidad: 1);
        $this->agregarTopping($linea, 'Servilletas', 0, 3);

        $contenido = $this->ticket($linea);

        $this->assertStringContainsString('+ Servilletas x3', $contenido);
        $this->assertStringNotContainsString('+$0', $contenido);
        $this->assertStringContainsString('1 x $45', $contenido);
    }

    public function test_el_descuento_de_la_linea_se_calcula_sobre_el_total_con_toppings(): void
    {
        $linea = $this->crearLinea(cantidad: 2, descuento: 10);
        $this->agregarTopping($linea, 'Nieve', 20, 2);

        $contenido = $this->ticket($linea);

        // Unitario 45 + 40 = 85; original 170; con 10% pagan 153 y se ahorran $17.00.
        $this->assertStringContainsString('2 x $85', $contenido);
        $this->assertStringContainsString('$153', $contenido);
        $this->assertStringContainsString('Desc. 10% (-$17.00)', $contenido);
    }

    public function test_una_linea_sin_toppings_se_imprime_igual_que_antes(): void
    {
        $linea = $this->crearLinea(cantidad: 3);

        $contenido = $this->ticket($linea);

        $this->assertStringContainsString('3 x $45', $contenido);
        $this->assertStringNotContainsString('+ ', $contenido);
    }
}
