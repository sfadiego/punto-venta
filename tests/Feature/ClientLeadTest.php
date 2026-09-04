<?php

namespace Tests\Feature;

use App\Enums\BusinessNicheEnum;
use App\Enums\ClientLeadStatusEnum;
use App\Enums\RoleEnum;
use App\Models\ClientLeadModel;
use App\Models\User;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ClientLeadTest extends TestCase
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

    // ── Store (endpoint público — "solicitar demo") ───────────

    public function test_crea_solicitud_de_demo(): void
    {
        $payload = $this->validPayload();

        $this->postJson('/api/demo-request', $payload)
            ->assertStatus(201)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.business_name', $payload['business_name'])
            ->assertJsonPath('data.status', ClientLeadStatusEnum::FollowUp->value);

        $this->assertDatabaseHas('client_leads', [
            'business_name' => $payload['business_name'],
            'email' => $payload['email'],
            'phone' => $payload['phone'],
            'business_niche' => BusinessNicheEnum::Taqueria->value,
            'status' => ClientLeadStatusEnum::FollowUp->value,
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
        $this->getJson('/api/super-admin/client-leads')->assertStatus(401);
    }

    public function test_index_no_accesible_con_token_admin(): void
    {
        $this->getJson('/api/super-admin/client-leads', $this->authHeaders())
            ->assertStatus(403);
    }

    public function test_index_lista_solicitudes(): void
    {
        ClientLeadModel::create($this->validPayload());

        $this->getJson('/api/super-admin/client-leads', $this->superAdminHeaders())
            ->assertStatus(206)
            ->assertJsonStructure(['current_page', 'data', 'total', 'per_page']);
    }

    public function test_index_filtra_por_status(): void
    {
        ClientLeadModel::create($this->validPayload(['email' => 'seguimiento@example.com']));
        ClientLeadModel::create(array_merge(
            $this->validPayload(['email' => 'cliente@example.com']),
            ['status' => ClientLeadStatusEnum::Customer->value],
        ));

        $response = $this->getJson(
            '/api/super-admin/client-leads?status='.ClientLeadStatusEnum::Customer->value,
            $this->superAdminHeaders(),
        );

        $response->assertStatus(206);
        $emails = collect($response->json('data'))->pluck('email');
        $this->assertTrue($emails->contains('cliente@example.com'));
        $this->assertFalse($emails->contains('seguimiento@example.com'));
    }

    // ── Store manual (solo superadmin) ─────────────────────────

    public function test_alta_manual_requiere_autenticacion_superadmin(): void
    {
        $this->postJson('/api/super-admin/client-leads', $this->validPayload())->assertStatus(401);
    }

    public function test_alta_manual_no_accesible_con_token_admin(): void
    {
        $this->postJson('/api/super-admin/client-leads', $this->validPayload(), $this->authHeaders())
            ->assertStatus(403);
    }

    public function test_alta_manual_crea_cliente_potencial_con_estatus_por_defecto(): void
    {
        $payload = $this->validPayload();

        $this->postJson('/api/super-admin/client-leads', $payload, $this->superAdminHeaders())
            ->assertStatus(201)
            ->assertJsonPath('data.business_name', $payload['business_name'])
            ->assertJsonPath('data.status', ClientLeadStatusEnum::FollowUp->value);

        $this->assertDatabaseHas('client_leads', [
            'email' => $payload['email'],
            'status' => ClientLeadStatusEnum::FollowUp->value,
        ]);
    }

    public function test_alta_manual_permite_definir_estatus_y_notas(): void
    {
        $payload = $this->validPayload([
            'status' => ClientLeadStatusEnum::Customer->value,
            'notes' => 'Ya es cliente, referido por otro negocio',
        ]);

        $this->postJson('/api/super-admin/client-leads', $payload, $this->superAdminHeaders())
            ->assertStatus(201)
            ->assertJsonPath('data.status', ClientLeadStatusEnum::Customer->value)
            ->assertJsonPath('data.notes', 'Ya es cliente, referido por otro negocio');
    }

    public function test_alta_manual_requiere_nombre_de_negocio(): void
    {
        $payload = $this->validPayload();
        unset($payload['business_name']);

        $this->postJson('/api/super-admin/client-leads', $payload, $this->superAdminHeaders())
            ->assertStatus(400);
    }

    // ── Update (solo superadmin) ───────────────────────────────

    public function test_actualiza_estatus_y_notas_de_solicitud(): void
    {
        $clientLead = ClientLeadModel::create($this->validPayload());

        $this->putJson("/api/super-admin/client-leads/{$clientLead->id}", [
            'status' => ClientLeadStatusEnum::Customer->value,
            'notes' => 'Se contactó por WhatsApp',
        ], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.status', ClientLeadStatusEnum::Customer->value)
            ->assertJsonPath('data.notes', 'Se contactó por WhatsApp');

        $this->assertDatabaseHas('client_leads', [
            'id' => $clientLead->id,
            'status' => ClientLeadStatusEnum::Customer->value,
            'notes' => 'Se contactó por WhatsApp',
        ]);
    }

    public function test_actualiza_requiere_estatus_valido(): void
    {
        $clientLead = ClientLeadModel::create($this->validPayload());

        $this->putJson("/api/super-admin/client-leads/{$clientLead->id}", [
            'status' => 'no-existe',
        ], $this->superAdminHeaders())->assertStatus(400);
    }

    public function test_actualiza_sin_autenticacion(): void
    {
        $clientLead = ClientLeadModel::create($this->validPayload());

        $this->putJson("/api/super-admin/client-leads/{$clientLead->id}", [
            'status' => ClientLeadStatusEnum::Discarded->value,
        ])->assertStatus(401);
    }

    public function test_actualiza_no_accesible_con_token_admin(): void
    {
        $clientLead = ClientLeadModel::create($this->validPayload());

        $this->putJson("/api/super-admin/client-leads/{$clientLead->id}", [
            'status' => ClientLeadStatusEnum::Discarded->value,
        ], $this->authHeaders())->assertStatus(403);
    }
}
