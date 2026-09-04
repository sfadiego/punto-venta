<?php

namespace Tests\Orders;

use App\Enums\BusinessTypeEnum;
use App\Enums\RoleEnum;
use App\Enums\UnidadMedidaEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\RolePermission;
use App\Models\User;
use App\Printer\Formatters\VentaFormatter;
use Tests\TestCase;

class PrintTest extends TestCase
{
    private function crearUsuario(RoleEnum $rol): User
    {
        return User::factory()->create([
            User::ROL_ID => $rol->value,
            User::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function otorgarPermiso(int $roleId, string $key): void
    {
        $permission = Permission::where(Permission::KEY, $key)->firstOrFail();

        RolePermission::create([
            RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
            RolePermission::ROLE_ID => $roleId,
            RolePermission::PERMISSION_ID => $permission->id,
        ]);
    }

    private function crearOrden(): OrderModel
    {
        $caja = MainOrderReportModel::factory()->create([
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        return OrderModel::factory()->create([
            OrderModel::SISTEMA_ID => $caja->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    public function test_print_sin_autenticacion_retorna_401(): void
    {
        $orden = $this->crearOrden();

        $this->postJson("/api/order/{$orden->id}/print")
            ->assertStatus(401);
    }

    public function test_print_orden_inexistente_retorna_404(): void
    {
        $this->postJson('/api/order/99999/print', [], $this->authHeaders())
            ->assertStatus(404);
    }

    public function test_print_retorna_error_sin_impresora_configurada(): void
    {
        $orden = $this->crearOrden();

        $this->postJson("/api/order/{$orden->id}/print", [], $this->authHeaders())
            ->assertStatus(422);
    }

    public function test_print_error_no_expone_mensaje_interno(): void
    {
        // El mensaje de la excepción real (rutas, detalles de conexión) no debe llegar
        // al cliente — solo un mensaje genérico; el detalle real queda en el log.
        $orden = $this->crearOrden();

        $this->postJson("/api/order/{$orden->id}/print", [], $this->authHeaders())
            ->assertStatus(422)
            ->assertJsonPath('message', 'No se pudo imprimir el ticket, intenta de nuevo.');
    }

    public function test_bytes_sin_autenticacion_retorna_401(): void
    {
        $orden = $this->crearOrden();

        $this->getJson("/api/order/{$orden->id}/print/bytes")
            ->assertStatus(401);
    }

    public function test_bytes_orden_inexistente_retorna_404(): void
    {
        $this->getJson('/api/order/99999/print/bytes', $this->authHeaders())
            ->assertStatus(404);
    }

    public function test_bytes_retorna_contenido_binario(): void
    {
        $orden = $this->crearOrden();

        $response = $this->get(
            "/api/order/{$orden->id}/print/bytes",
            array_merge($this->authHeaders(), ['Accept' => '*/*'])
        );

        $response->assertStatus(200);
        $this->assertStringContainsString('application/octet-stream', $response->headers->get('Content-Type'));
    }

    // ── Ancho de papel ───────────────────────────────────────

    public function test_bytes_usa_32_caracteres_por_linea_con_papel_58mm(): void
    {
        $tenant = BusinessConfigModel::first();
        $tenant->update([BusinessConfigModel::PAPER_WIDTH => '58']);

        $orden = $this->crearOrden();

        $response = $this->get(
            "/api/order/{$orden->id}/print/bytes",
            array_merge($this->authHeaders(), ['Accept' => '*/*'])
        )->assertStatus(200);

        $this->assertStringContainsString(str_repeat('=', 32), $response->getContent());
        $this->assertStringNotContainsString(str_repeat('=', 48), $response->getContent());
    }

    public function test_bytes_usa_48_caracteres_por_linea_con_papel_80mm(): void
    {
        $tenant = BusinessConfigModel::first();
        $tenant->update([BusinessConfigModel::PAPER_WIDTH => '80']);

        $orden = $this->crearOrden();

        $response = $this->get(
            "/api/order/{$orden->id}/print/bytes",
            array_merge($this->authHeaders(), ['Accept' => '*/*'])
        )->assertStatus(200);

        $this->assertStringContainsString(str_repeat('=', 48), $response->getContent());
    }

    // ── Ticket de prueba del agente (test-bytes) ──────────────

    public function test_ticket_prueba_sin_autenticacion_retorna_401(): void
    {
        $this->getJson('/api/order/print/test-bytes')
            ->assertStatus(401);
    }

    public function test_ticket_prueba_retorna_contenido_binario(): void
    {
        $response = $this->get(
            '/api/order/print/test-bytes',
            array_merge($this->authHeaders(), ['Accept' => '*/*'])
        );

        $response->assertStatus(200);
        $this->assertStringContainsString('application/octet-stream', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('PRUEBA DE IMPRESION', $response->getContent());
    }

    public function test_chars_for_paper_width_58mm_retorna_32(): void
    {
        $this->assertEquals(32, VentaFormatter::charsForPaperWidth('58'));
    }

    public function test_chars_for_paper_width_80mm_retorna_48(): void
    {
        $this->assertEquals(48, VentaFormatter::charsForPaperWidth('80'));
    }

    public function test_chars_for_paper_width_nulo_retorna_32_por_defecto(): void
    {
        $this->assertEquals(32, VentaFormatter::charsForPaperWidth(null));
    }

    public function test_chars_for_paper_width_valor_desconocido_retorna_32_por_defecto(): void
    {
        $this->assertEquals(32, VentaFormatter::charsForPaperWidth('999'));
    }

    // ── Unidad de medida en el ticket ───────────────────────────

    public function test_bytes_producto_en_litros_se_imprime_con_decimales(): void
    {
        $orden = $this->crearOrden();

        $producto = ProductModel::factory()->create([
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::PRECIO => 20,
            ProductModel::UNIDAD_MEDIDA => UnidadMedidaEnum::Litro,
        ]);

        OrderProductModel::factory()->create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $producto->id,
            OrderProductModel::CANTIDAD => 1.5,
            OrderProductModel::PRECIO => 20,
            OrderProductModel::DESCUENTO => 0,
        ]);

        $response = $this->get(
            "/api/order/{$orden->id}/print/bytes",
            array_merge($this->authHeaders(), ['Accept' => '*/*'])
        )->assertStatus(200);

        // Unidad continua (litro) → cantidad con decimales, no como entero
        // (ceros sobrantes se recortan: 1.500 -> "1.5", $20.00 -> "$20").
        $this->assertStringContainsString('1.5 litro x $20', $response->getContent());
    }

    public function test_bytes_producto_por_unidad_se_imprime_como_entero(): void
    {
        $orden = $this->crearOrden();

        $producto = ProductModel::factory()->create([
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::PRECIO => 45,
            ProductModel::UNIDAD_MEDIDA => UnidadMedidaEnum::Unidad,
        ]);

        OrderProductModel::factory()->create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $producto->id,
            OrderProductModel::CANTIDAD => 3,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ]);

        $response = $this->get(
            "/api/order/{$orden->id}/print/bytes",
            array_merge($this->authHeaders(), ['Accept' => '*/*'])
        )->assertStatus(200);

        $this->assertStringContainsString('3 x $45', $response->getContent());
        $this->assertStringNotContainsString('3.000', $response->getContent());
    }

    // ── Costo de domicilio en el ticket ─────────────────────────

    public function test_bytes_domicilio_cliente_paga_se_imprime_con_signo_positivo(): void
    {
        $orden = $this->crearOrden();
        $orden->update([
            OrderModel::IS_DELIVERY => true,
            OrderModel::COSTO_DOMICILIO => 30,
        ]);

        $response = $this->get(
            "/api/order/{$orden->id}/print/bytes",
            array_merge($this->authHeaders(), ['Accept' => '*/*'])
        )->assertStatus(200);

        $this->assertStringContainsString('+$30.00', $response->getContent());
    }

    public function test_bytes_domicilio_negocio_paga_no_se_imprime(): void
    {
        $orden = $this->crearOrden();
        $orden->update([
            OrderModel::IS_DELIVERY => true,
            OrderModel::COSTO_DOMICILIO => -30,
        ]);

        $response = $this->get(
            "/api/order/{$orden->id}/print/bytes",
            array_merge($this->authHeaders(), ['Accept' => '*/*'])
        )->assertStatus(200);

        // El domicilio absorbido por el negocio no se cobra al cliente, no debe aparecer en el ticket.
        $this->assertStringNotContainsString('Domicilio', $response->getContent());
    }

    // ── Etiqueta de mesa/pedido según tipo de negocio ────────────

    public function test_bytes_muestra_mesa_en_restaurante(): void
    {
        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante,
        ]);

        $orden = $this->crearOrden();

        $response = $this->get(
            "/api/order/{$orden->id}/print/bytes",
            array_merge($this->authHeaders(), ['Accept' => '*/*'])
        )->assertStatus(200);

        $this->assertStringContainsString('Mesa :', $response->getContent());
    }

    public function test_bytes_muestra_pedido_en_venta_por_peso(): void
    {
        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::VentaPorPeso,
        ]);

        $orden = $this->crearOrden();

        $response = $this->get(
            "/api/order/{$orden->id}/print/bytes",
            array_merge($this->authHeaders(), ['Accept' => '*/*'])
        )->assertStatus(200);

        $this->assertStringContainsString('Pedido:', $response->getContent());
        $this->assertStringNotContainsString('Mesa :', $response->getContent());
    }

    public function test_bytes_muestra_pedido_en_retail(): void
    {
        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail,
        ]);

        $orden = $this->crearOrden();

        $response = $this->get(
            "/api/order/{$orden->id}/print/bytes",
            array_merge($this->authHeaders(), ['Accept' => '*/*'])
        )->assertStatus(200);

        // Retail es venta de mostrador, no servicio en mesa — mismo texto que venta por peso.
        $this->assertStringContainsString('Pedido:', $response->getContent());
        $this->assertStringNotContainsString('Mesa :', $response->getContent());
    }

    // ── Propina: solo aplica a negocios con servicio en mesa (kitchen_view) ──

    public function test_bytes_propina_aparece_en_restaurante(): void
    {
        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante,
        ]);

        $orden = $this->crearOrden();

        $response = $this->get(
            "/api/order/{$orden->id}/print/bytes",
            array_merge($this->authHeaders(), ['Accept' => '*/*'])
        )->assertStatus(200);

        $this->assertStringContainsString('Propina 10%', $response->getContent());
    }

    public function test_bytes_propina_no_aparece_en_venta_por_peso(): void
    {
        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::VentaPorPeso,
        ]);

        $orden = $this->crearOrden();

        $response = $this->get(
            "/api/order/{$orden->id}/print/bytes",
            array_merge($this->authHeaders(), ['Accept' => '*/*'])
        )->assertStatus(200);

        $this->assertStringNotContainsString('Propina', $response->getContent());
    }

    public function test_bytes_propina_no_aparece_en_retail(): void
    {
        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail,
        ]);

        $orden = $this->crearOrden();

        $response = $this->get(
            "/api/order/{$orden->id}/print/bytes",
            array_merge($this->authHeaders(), ['Accept' => '*/*'])
        )->assertStatus(200);

        $this->assertStringNotContainsString('Propina', $response->getContent());
    }

    public function test_bytes_propina_no_incluye_costo_domicilio(): void
    {
        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante,
        ]);

        $orden = $this->crearOrden();
        $orden->update([
            OrderModel::SUBTOTAL => 970,
            OrderModel::TOTAL => 1000,
            OrderModel::DESCUENTO => 0,
            OrderModel::IS_DELIVERY => true,
            OrderModel::COSTO_DOMICILIO => 30,
        ]);

        $response = $this->get(
            "/api/order/{$orden->id}/print/bytes",
            array_merge($this->authHeaders(), ['Accept' => '*/*'])
        )->assertStatus(200);

        // Propina = 10% de 970 (subtotal, sin domicilio) = $97.00, no 10% de 1000.
        $this->assertStringContainsString('$97.00', $response->getContent());
        $this->assertStringNotContainsString('$100.00', $response->getContent());
    }

    // ── Autorización: los endpoints de impresión no tenían middleware de permiso —
    // cualquier usuario autenticado del tenant podía imprimir sin tener printTicket. ──

    public function test_print_requiere_permiso_print_ticket(): void
    {
        $cocina = $this->crearUsuario(RoleEnum::COCINA);
        $this->otorgarPermiso($cocina->rol_id, 'kitchenView');

        $orden = $this->crearOrden();

        $this->postJson("/api/order/{$orden->id}/print", [], $this->authHeaders($cocina))
            ->assertStatus(403);
    }

    public function test_print_permite_con_permiso_print_ticket_otorgado(): void
    {
        $cocina = $this->crearUsuario(RoleEnum::COCINA);
        $this->otorgarPermiso($cocina->rol_id, 'printTicket');

        $orden = $this->crearOrden();

        // Sin impresora configurada el flujo real falla en 422 (ver test_print_retorna_error_sin_impresora_configurada) —
        // lo relevante aquí es que YA NO es 403, es decir, el middleware de permiso lo dejó pasar.
        $this->postJson("/api/order/{$orden->id}/print", [], $this->authHeaders($cocina))
            ->assertStatus(422);
    }

    public function test_bytes_requiere_permiso_print_ticket(): void
    {
        $caja = $this->crearUsuario(RoleEnum::CAJA);
        $this->otorgarPermiso($caja->rol_id, 'payOrder');

        $orden = $this->crearOrden();

        $this->getJson("/api/order/{$orden->id}/print/bytes", $this->authHeaders($caja))
            ->assertStatus(403);
    }

    public function test_bytes_permite_con_permiso_print_ticket_otorgado(): void
    {
        $caja = $this->crearUsuario(RoleEnum::CAJA);
        $this->otorgarPermiso($caja->rol_id, 'printTicket');

        $orden = $this->crearOrden();

        $this->get(
            "/api/order/{$orden->id}/print/bytes",
            array_merge($this->authHeaders($caja), ['Accept' => '*/*'])
        )->assertStatus(200);
    }

    public function test_ticket_prueba_requiere_permiso_print_ticket(): void
    {
        $cocina = $this->crearUsuario(RoleEnum::COCINA);
        $this->otorgarPermiso($cocina->rol_id, 'kitchenView');

        $this->getJson('/api/order/print/test-bytes', $this->authHeaders($cocina))
            ->assertStatus(403);
    }

    public function test_ticket_prueba_permite_con_permiso_print_ticket_otorgado(): void
    {
        $cocina = $this->crearUsuario(RoleEnum::COCINA);
        $this->otorgarPermiso($cocina->rol_id, 'printTicket');

        $response = $this->get(
            '/api/order/print/test-bytes',
            array_merge($this->authHeaders($cocina), ['Accept' => '*/*'])
        );

        $response->assertStatus(200);
    }
}
