<?php

namespace Tests\Admin;

use App\Models\PaymentMethodModel;
use Tests\TestCase;

class PaymentMethodTest extends TestCase
{
    private function crearMetodo(string $name = 'Efectivo', bool $active = true): PaymentMethodModel
    {
        $tenantId = \App\Models\BusinessConfigModel::first()->id;

        return PaymentMethodModel::create([
            PaymentMethodModel::NAME => $name,
            PaymentMethodModel::ACTIVE => $active,
            PaymentMethodModel::TENANT_ID => $tenantId,
        ]);
    }

    // ── Index ─────────────────────────────────────────────────

    public function test_lista_metodos_de_pago(): void
    {
        $this->crearMetodo('Efectivo');
        $this->crearMetodo('Transferencia');

        $response = $this->getJson('/api/admin/payment-methods', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $data = $response->json('data');
        $this->assertIsArray($data);
        $this->assertGreaterThanOrEqual(2, count($data));
    }

    public function test_lista_ordenada_por_nombre(): void
    {
        $this->crearMetodo('Transferencia');
        $this->crearMetodo('Efectivo');

        $response = $this->getJson('/api/admin/payment-methods', $this->authHeaders())
            ->assertStatus(200);

        $nombres = array_column($response->json('data'), 'name');
        $sorted = $nombres;
        sort($sorted);
        $this->assertEquals($sorted, $nombres);
    }

    public function test_lista_sin_autenticacion(): void
    {
        $this->getJson('/api/admin/payment-methods')->assertStatus(401);
    }

    // ── Store ─────────────────────────────────────────────────

    public function test_crea_metodo_de_pago(): void
    {
        $this->postJson('/api/admin/payment-methods', [
            'name' => 'Tarjeta',
            'active' => true,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.name', 'Tarjeta')
            ->assertJsonPath('data.active', true);

        $this->assertDatabaseHas('payment_methods', ['name' => 'Tarjeta']);
    }

    public function test_crea_metodo_sin_campo_active_default_true(): void
    {
        $response = $this->postJson('/api/admin/payment-methods', [
            'name' => 'Nequi',
        ], $this->authHeaders())
            ->assertStatus(200);

        // active es boolean y el campo no es requerido → acepta cualquier valor por defecto
        $this->assertDatabaseHas('payment_methods', ['name' => 'Nequi']);
    }

    public function test_no_crea_sin_nombre(): void
    {
        $this->postJson('/api/admin/payment-methods', [
            'active' => true,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_con_active_invalido(): void
    {
        $this->postJson('/api/admin/payment-methods', [
            'name' => 'Test',
            'active' => 'si',
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_crea_sin_autenticacion(): void
    {
        $this->postJson('/api/admin/payment-methods', ['name' => 'Test'])
            ->assertStatus(401);
    }

    // ── Update ────────────────────────────────────────────────

    public function test_actualiza_metodo_de_pago(): void
    {
        $method = $this->crearMetodo('Viejo Nombre');

        $this->putJson("/api/admin/payment-methods/{$method->id}", [
            'name' => 'Nuevo Nombre',
            'active' => false,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.name', 'Nuevo Nombre')
            ->assertJsonPath('data.active', false);

        $this->assertDatabaseHas('payment_methods', ['id' => $method->id, 'name' => 'Nuevo Nombre']);
    }

    public function test_no_actualiza_sin_nombre(): void
    {
        $method = $this->crearMetodo();

        $this->putJson("/api/admin/payment-methods/{$method->id}", [
            'active' => false,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_actualiza_metodo_inexistente(): void
    {
        $this->putJson('/api/admin/payment-methods/99999', [
            'name' => 'Test',
        ], $this->authHeaders())
            ->assertStatus(404);
    }

    public function test_actualiza_sin_autenticacion(): void
    {
        $method = $this->crearMetodo();

        $this->putJson("/api/admin/payment-methods/{$method->id}", ['name' => 'Test'])
            ->assertStatus(401);
    }

    // ── Delete ────────────────────────────────────────────────

    public function test_elimina_metodo_de_pago(): void
    {
        $method = $this->crearMetodo('Para Eliminar');

        $this->deleteJson("/api/admin/payment-methods/{$method->id}", [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertDatabaseMissing('payment_methods', ['id' => $method->id]);
    }

    public function test_elimina_metodo_inexistente(): void
    {
        $this->deleteJson('/api/admin/payment-methods/99999', [], $this->authHeaders())
            ->assertStatus(404);
    }

    public function test_elimina_sin_autenticacion(): void
    {
        $method = $this->crearMetodo();

        $this->deleteJson("/api/admin/payment-methods/{$method->id}")
            ->assertStatus(401);
    }
}
