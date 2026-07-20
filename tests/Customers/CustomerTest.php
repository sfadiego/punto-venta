<?php

namespace Tests\Customers;

use App\Models\BusinessConfigModel;
use App\Models\CustomerModel;
use Tests\TestCase;

class CustomerTest extends TestCase
{
    private function crearCliente(array $overrides = []): CustomerModel
    {
        return CustomerModel::create(array_merge([
            CustomerModel::NAME => 'Loncheria Test '.uniqid(),
            CustomerModel::PHONE => '5512345678',
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
        ], $overrides));
    }

    // ── Index ────────────────────────────────────────────────

    public function test_lista_clientes_paginada(): void
    {
        $this->crearCliente();

        $this->getJson('/api/customer?page=1&limit=5', $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonStructure(['current_page', 'data', 'total', 'per_page']);
    }

    public function test_busca_cliente_por_nombre(): void
    {
        $customer = $this->crearCliente(['name' => 'Loncheria Doña Mary']);
        $this->crearCliente(['name' => 'Otro Cliente']);

        $response = $this->getJson('/api/customer?search=Doña Mary', $this->authHeaders())
            ->assertStatus(206);

        $names = array_column($response->json('data'), 'name');
        $this->assertContains($customer->name, $names);
        $this->assertNotContains('Otro Cliente', $names);
    }

    public function test_busca_cliente_por_telefono(): void
    {
        $customer = $this->crearCliente(['phone' => '5511122233']);
        $this->crearCliente(['phone' => '5599988877']);

        $response = $this->getJson('/api/customer?search=11122', $this->authHeaders())
            ->assertStatus(206);

        $phones = array_column($response->json('data'), 'phone');
        $this->assertContains($customer->phone, $phones);
        $this->assertNotContains('5599988877', $phones);
    }

    // ── Store ────────────────────────────────────────────────

    public function test_crea_cliente(): void
    {
        $response = $this->postJson('/api/customer', [
            'name' => 'Loncheria Doña Mary',
            'phone' => '5512345678',
        ], $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.name', 'Loncheria Doña Mary')
            ->assertJsonPath('data.allow_credit', true);

        $this->assertDatabaseHas('customers', [
            'name' => 'Loncheria Doña Mary',
            'balance' => 0,
        ]);
    }

    public function test_no_crea_cliente_con_nombre_duplicado(): void
    {
        $existing = $this->crearCliente();

        $this->postJson('/api/customer', [
            'name' => $existing->name,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_cliente_sin_nombre(): void
    {
        $this->postJson('/api/customer', [], $this->authHeaders())
            ->assertStatus(400);
    }

    // ── Show ─────────────────────────────────────────────────

    public function test_muestra_cliente_con_detalle(): void
    {
        $customer = $this->crearCliente();

        $this->getJson("/api/customer/{$customer->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.id', $customer->id)
            ->assertJsonStructure(['data' => ['id', 'name', 'balance', 'credit_orders', 'payments']]);
    }

    public function test_cliente_inexistente_retorna_404(): void
    {
        $this->getJson('/api/customer/99999', $this->authHeaders())
            ->assertStatus(404);
    }

    // ── Update ───────────────────────────────────────────────

    public function test_actualiza_cliente(): void
    {
        $customer = $this->crearCliente();

        $this->putJson("/api/customer/{$customer->id}", [
            'name' => 'Nombre Actualizado',
            'phone' => '5599998888',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.name', 'Nombre Actualizado');

        $this->assertDatabaseHas('customers', ['id' => $customer->id, 'name' => 'Nombre Actualizado']);
    }

    // ── Toggle credit ────────────────────────────────────────

    public function test_alterna_permite_credito(): void
    {
        $customer = $this->crearCliente();
        $this->assertTrue((bool) $customer->fresh()->allow_credit);

        $this->patchJson("/api/customer/{$customer->id}/toggle-credit", [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.allow_credit', false);

        $this->assertDatabaseHas('customers', ['id' => $customer->id, 'allow_credit' => false]);

        $this->patchJson("/api/customer/{$customer->id}/toggle-credit", [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.allow_credit', true);
    }

    // ── Delete ───────────────────────────────────────────────

    public function test_elimina_cliente(): void
    {
        $customer = $this->crearCliente();

        $this->deleteJson("/api/customer/{$customer->id}", [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertSoftDeleted('customers', ['id' => $customer->id]);
    }

    // ── List (simple) ────────────────────────────────────────

    public function test_lista_clientes_simple(): void
    {
        $this->crearCliente();

        $response = $this->getJson('/api/customer/list', $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['status', 'data' => [['id', 'name', 'phone', 'allow_credit', 'balance']]]);
    }

    // ── Auth ─────────────────────────────────────────────────

    public function test_sin_autenticacion_no_accede(): void
    {
        $this->getJson('/api/customer')->assertStatus(401);
    }
}
