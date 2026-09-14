<?php

namespace Tests\Customers;

use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CustomerChargeModel;
use App\Models\CustomerModel;
use App\Models\User;
use Tests\TestCase;

/**
 * Cargo manual — para dar de alta el adeudo que un cliente ya traía antes de empezar a usar
 * el sistema (POST /customer/{id}/charge). Movimiento inverso a registerPayment(): suma al
 * balance en vez de restar, sin cota superior.
 */
class CustomerChargeTest extends TestCase
{
    private function crearCliente(array $overrides = []): CustomerModel
    {
        return CustomerModel::create(array_merge([
            CustomerModel::NAME => 'Cliente Test '.uniqid(),
            CustomerModel::PHONE => '5512345678',
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
        ], $overrides));
    }

    private function crearUsuario(RoleEnum $rol): User
    {
        return User::factory()->create([
            User::ROL_ID => $rol->value,
            User::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    public function test_admin_agrega_un_cargo(): void
    {
        $customer = $this->crearCliente(['balance' => 100]);

        $response = $this->postJson("/api/customer/{$customer->id}/charge", [
            'amount' => 50,
            'note' => 'Adeudo previo al sistema',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.amount', '50.00')
            ->assertJsonPath('data.note', 'Adeudo previo al sistema');

        $customer->refresh();
        $this->assertEquals(150, $customer->balance);

        $charge = CustomerChargeModel::where(CustomerChargeModel::CUSTOMER_ID, $customer->id)->firstOrFail();
        $this->assertEquals(50, $charge->amount);
        $this->assertNotNull($charge->created_by);

        $response->assertJsonPath('data.customer.id', $customer->id);
    }

    public function test_cargo_sin_nota_es_valido(): void
    {
        $customer = $this->crearCliente(['balance' => 0]);

        $this->postJson("/api/customer/{$customer->id}/charge", [
            'amount' => 25,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.note', null);

        $customer->refresh();
        $this->assertEquals(25, $customer->balance);
    }

    public function test_dos_cargos_seguidos_se_acumulan(): void
    {
        $customer = $this->crearCliente(['balance' => 0]);

        $this->postJson("/api/customer/{$customer->id}/charge", ['amount' => 40], $this->authHeaders())
            ->assertStatus(200);
        $this->postJson("/api/customer/{$customer->id}/charge", ['amount' => 60], $this->authHeaders())
            ->assertStatus(200);

        $customer->refresh();
        $this->assertEquals(100, $customer->balance);
        $this->assertEquals(2, CustomerChargeModel::where(CustomerChargeModel::CUSTOMER_ID, $customer->id)->count());
    }

    public function test_cargo_no_tiene_cota_superior(): void
    {
        // A diferencia de registerPayment(), un cargo puede exceder cualquier balance previo
        // (no existe "adeudo actual" que limite hacia arriba).
        $customer = $this->crearCliente(['balance' => 10]);

        $this->postJson("/api/customer/{$customer->id}/charge", [
            'amount' => 99999,
        ], $this->authHeaders())->assertStatus(200);

        $customer->refresh();
        $this->assertEquals(100009, $customer->balance);
    }

    public function test_monto_cero_es_invalido(): void
    {
        $customer = $this->crearCliente();

        $this->postJson("/api/customer/{$customer->id}/charge", [
            'amount' => 0,
        ], $this->authHeaders())->assertStatus(400);
    }

    public function test_monto_negativo_es_invalido(): void
    {
        $customer = $this->crearCliente();

        $this->postJson("/api/customer/{$customer->id}/charge", [
            'amount' => -10,
        ], $this->authHeaders())->assertStatus(400);
    }

    public function test_monto_no_numerico_es_invalido(): void
    {
        $customer = $this->crearCliente();

        $this->postJson("/api/customer/{$customer->id}/charge", [
            'amount' => 'abc',
        ], $this->authHeaders())->assertStatus(400);
    }

    public function test_falta_amount_es_invalido(): void
    {
        $customer = $this->crearCliente();

        $this->postJson("/api/customer/{$customer->id}/charge", [], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_rol_no_admin_no_puede_agregar_cargo(): void
    {
        $customer = $this->crearCliente();
        $employe = $this->crearUsuario(RoleEnum::EMPLOYE);

        $this->postJson("/api/customer/{$customer->id}/charge", [
            'amount' => 10,
        ], $this->authHeaders($employe))->assertStatus(403);
    }

    public function test_caja_no_puede_agregar_cargo(): void
    {
        $customer = $this->crearCliente();
        $caja = $this->crearUsuario(RoleEnum::CAJA);

        $this->postJson("/api/customer/{$customer->id}/charge", [
            'amount' => 10,
        ], $this->authHeaders($caja))->assertStatus(403);
    }

    public function test_sin_autenticacion_no_puede_agregar_cargo(): void
    {
        $customer = $this->crearCliente();

        $this->postJson("/api/customer/{$customer->id}/charge", ['amount' => 10])
            ->assertStatus(401);
    }

    public function test_show_incluye_la_relacion_charges(): void
    {
        $customer = $this->crearCliente();

        $this->postJson("/api/customer/{$customer->id}/charge", [
            'amount' => 30,
            'note' => 'Cargo inicial',
        ], $this->authHeaders())->assertStatus(200);

        $this->getJson("/api/customer/{$customer->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.charges.0.amount', '30.00')
            ->assertJsonPath('data.charges.0.note', 'Cargo inicial');
    }

    public function test_aislamiento_multi_tenant_cargos(): void
    {
        $customerA = $this->crearCliente(['balance' => 0]);

        $tenantB = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'tenant-b-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Tenant B',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'lifetime',
        ]);
        $adminB = User::create([
            User::NOMBRE => 'Admin',
            User::APELLIDO_PATERNO => 'B',
            User::APELLIDO_MATERNO => '',
            User::EMAIL => 'admin-b-'.uniqid().'@test.com',
            User::USUARIO => 'admin-b-'.uniqid(),
            User::PASSWORD => bcrypt('password123'),
            User::ROL_ID => RoleEnum::ADMIN->value,
            User::ACTIVO => true,
            User::TENANT_ID => $tenantB->id,
        ]);

        // El admin del tenant B no debe poder agregar un cargo a un cliente de otro tenant.
        $this->postJson("/api/customer/{$customerA->id}/charge", [
            'amount' => 10,
        ], $this->authHeaders($adminB))->assertStatus(404);

        $customerA->refresh();
        $this->assertEquals(0, $customerA->balance);
    }
}
