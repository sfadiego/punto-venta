<?php

namespace Tests\Feature;

use App\Enums\BusinessNicheEnum;
use App\Enums\DemoRequestStatusEnum;
use App\Enums\RoleEnum;
use App\Models\DemoRequestModel;
use App\Models\User;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class DemoRequestTest extends TestCase
{
    private function superAdminHeaders(): array
    {
        $user = User::where('rol_id', RoleEnum::SUPERADMIN->value)->first();

        return $this->authHeaders($user);
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'business_name' => 'Taqueria de prueba',
            'email' => 'demo'.uniqid().'@example.com',
            'phone' => '5512345678',
            'business_niche' => BusinessNicheEnum::Taqueria->value,
        ], $overrides);
    }

    // ── Store (endpoint público) ──────────────────────────────

    public function test_crea_solicitud_de_demo(): void
    {
        $payload = $this->validPayload();

        $this->postJson('/api/demo-request', $payload)
            ->assertStatus(201)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.business_name', $payload['business_name'])
            ->assertJsonPath('data.status', DemoRequestStatusEnum::Pending->value);

        $this->assertDatabaseHas('demo_requests', [
            'business_name' => $payload['business_name'],
            'email' => $payload['email'],
            'phone' => $payload['phone'],
            'business_niche' => BusinessNicheEnum::Taqueria->value,
            'status' => DemoRequestStatusEnum::Pending->value,
        ]);
    }

    public function test_endpoint_es_publico_sin_autenticacion(): void
    {
        // No se pasan headers de auth — el endpoint es público
        $this->postJson('/api/demo-request', $this->validPayload())
            ->assertStatus(201);
    }

    public function test_solicitud_requiere_nombre_de_negocio(): void
    {
        $payload = $this->validPayload();
        unset($payload['business_name']);

        $this->postJson('/api/demo-request', $payload)->assertStatus(400);
    }

    public function test_solicitud_requiere_email(): void
    {
        $payload = $this->validPayload();
        unset($payload['email']);

        $this->postJson('/api/demo-request', $payload)->assertStatus(400);
    }

    public function test_solicitud_rechaza_email_invalido(): void
    {
        $this->postJson('/api/demo-request', $this->validPayload(['email' => 'no-es-un-email']))
            ->assertStatus(400);
    }

    public function test_solicitud_requiere_telefono(): void
    {
        $payload = $this->validPayload();
        unset($payload['phone']);

        $this->postJson('/api/demo-request', $payload)->assertStatus(400);
    }

    public function test_solicitud_rechaza_telefono_muy_corto(): void
    {
        $this->postJson('/api/demo-request', $this->validPayload(['phone' => '12345']))
            ->assertStatus(400);
    }

    public function test_solicitud_rechaza_telefono_con_letras(): void
    {
        $this->postJson('/api/demo-request', $this->validPayload(['phone' => '55abcd5678']))
            ->assertStatus(400);
    }

    public function test_solicitud_acepta_telefono_con_lada_de_pais(): void
    {
        $this->postJson('/api/demo-request', $this->validPayload(['phone' => '+523121166870']))
            ->assertStatus(201);
    }

    #[DataProvider('telefonosDeBajaEntropia')]
    public function test_solicitud_rechaza_telefono_de_baja_entropia(string $phone): void
    {
        $this->postJson('/api/demo-request', $this->validPayload(['phone' => $phone]))
            ->assertStatus(400);
    }

    public static function telefonosDeBajaEntropia(): array
    {
        return [
            'unidad repetida (123123123123)' => ['123123123123'],
            'todos los dígitos iguales' => ['0000000000'],
            'secuencia ascendente' => ['1234567890'],
            'secuencia descendente' => ['9876543210'],
        ];
    }

    public function test_solicitud_requiere_giro_de_negocio(): void
    {
        $payload = $this->validPayload();
        unset($payload['business_niche']);

        $this->postJson('/api/demo-request', $payload)->assertStatus(400);
    }

    public function test_solicitud_rechaza_giro_invalido(): void
    {
        $this->postJson('/api/demo-request', $this->validPayload(['business_niche' => 'no-existe']))
            ->assertStatus(400);
    }

    // ── Index (solo superadmin) ────────────────────────────────

    public function test_index_requiere_autenticacion_superadmin(): void
    {
        $this->getJson('/api/super-admin/demo-requests')->assertStatus(401);
    }

    public function test_index_no_accesible_con_token_admin(): void
    {
        $this->getJson('/api/super-admin/demo-requests', $this->authHeaders())
            ->assertStatus(403);
    }

    public function test_index_lista_solicitudes(): void
    {
        DemoRequestModel::create($this->validPayload());

        $this->getJson('/api/super-admin/demo-requests', $this->superAdminHeaders())
            ->assertStatus(206)
            ->assertJsonStructure(['current_page', 'data', 'total', 'per_page']);
    }

    public function test_index_filtra_por_status(): void
    {
        DemoRequestModel::create($this->validPayload(['email' => 'pendiente@example.com']));
        DemoRequestModel::create(array_merge(
            $this->validPayload(['email' => 'contactado@example.com']),
            ['status' => DemoRequestStatusEnum::Contacted->value],
        ));

        $response = $this->getJson(
            '/api/super-admin/demo-requests?status='.DemoRequestStatusEnum::Contacted->value,
            $this->superAdminHeaders(),
        );

        $response->assertStatus(206);
        $emails = collect($response->json('data'))->pluck('email');
        $this->assertTrue($emails->contains('contactado@example.com'));
        $this->assertFalse($emails->contains('pendiente@example.com'));
    }

    // ── Update (solo superadmin) ───────────────────────────────

    public function test_actualiza_estatus_y_notas_de_solicitud(): void
    {
        $demoRequest = DemoRequestModel::create($this->validPayload());

        $this->putJson("/api/super-admin/demo-requests/{$demoRequest->id}", [
            'status' => DemoRequestStatusEnum::Contacted->value,
            'notes' => 'Se contactó por WhatsApp',
        ], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.status', DemoRequestStatusEnum::Contacted->value)
            ->assertJsonPath('data.notes', 'Se contactó por WhatsApp');

        $this->assertDatabaseHas('demo_requests', [
            'id' => $demoRequest->id,
            'status' => DemoRequestStatusEnum::Contacted->value,
            'notes' => 'Se contactó por WhatsApp',
        ]);
    }

    public function test_actualiza_requiere_estatus_valido(): void
    {
        $demoRequest = DemoRequestModel::create($this->validPayload());

        $this->putJson("/api/super-admin/demo-requests/{$demoRequest->id}", [
            'status' => 'no-existe',
        ], $this->superAdminHeaders())->assertStatus(400);
    }

    public function test_actualiza_sin_autenticacion(): void
    {
        $demoRequest = DemoRequestModel::create($this->validPayload());

        $this->putJson("/api/super-admin/demo-requests/{$demoRequest->id}", [
            'status' => DemoRequestStatusEnum::Discarded->value,
        ])->assertStatus(401);
    }

    public function test_actualiza_no_accesible_con_token_admin(): void
    {
        $demoRequest = DemoRequestModel::create($this->validPayload());

        $this->putJson("/api/super-admin/demo-requests/{$demoRequest->id}", [
            'status' => DemoRequestStatusEnum::Discarded->value,
        ], $this->authHeaders())->assertStatus(403);
    }
}
