<?php

namespace Tests\Orders;

use App\Models\BusinessConfigModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Printer\Formatters\VentaFormatter;
use Tests\TestCase;

class PrintTest extends TestCase
{
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
}
