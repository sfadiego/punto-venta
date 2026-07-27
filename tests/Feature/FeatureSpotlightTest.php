<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Models\User;
use Tests\TestCase;

class FeatureSpotlightTest extends TestCase
{
    // ── index ──────────────────────────────────────────────────

    public function test_index_requiere_autenticacion(): void
    {
        $this->getJson('/api/feature-spotlights/seen')
            ->assertStatus(401);
    }

    public function test_index_devuelve_vacio_si_no_hay_features_vistos(): void
    {
        $response = $this->getJson('/api/feature-spotlights/seen', $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data', []);
    }

    public function test_index_devuelve_los_keys_marcados_como_vistos(): void
    {
        $headers = $this->authHeaders();

        $this->postJson('/api/feature-spotlights/role_permissions/seen', [], $headers);

        $response = $this->getJson('/api/feature-spotlights/seen', $headers);

        $response->assertStatus(200)
            ->assertJsonPath('data', ['role_permissions']);
    }

    // ── markSeen ───────────────────────────────────────────────

    public function test_mark_seen_requiere_autenticacion(): void
    {
        $this->postJson('/api/feature-spotlights/role_permissions/seen')
            ->assertStatus(401);
    }

    public function test_mark_seen_rechaza_un_key_no_reconocido(): void
    {
        $response = $this->postJson('/api/feature-spotlights/key_inexistente/seen', [], $this->authHeaders());

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error');

        $this->assertDatabaseMissing('feature_spotlights_seen', [
            'feature_key' => 'key_inexistente',
        ]);
    }

    public function test_mark_seen_registra_el_feature_para_el_usuario(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->postJson('/api/feature-spotlights/role_permissions/seen', [], $this->authHeaders($user))
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertDatabaseHas('feature_spotlights_seen', [
            'user_id' => $user->id,
            'feature_key' => 'role_permissions',
        ]);
    }

    public function test_mark_seen_es_idempotente(): void
    {
        $headers = $this->authHeaders();

        $this->postJson('/api/feature-spotlights/role_permissions/seen', [], $headers)->assertStatus(200);
        $this->postJson('/api/feature-spotlights/role_permissions/seen', [], $headers)->assertStatus(200);

        $this->assertDatabaseCount('feature_spotlights_seen', 1);
    }

    public function test_mark_seen_no_afecta_a_otros_usuarios(): void
    {
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();
        $employe = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();

        $this->postJson('/api/feature-spotlights/role_permissions/seen', [], $this->authHeaders($admin))
            ->assertStatus(200);

        // Verificado a nivel de datos (no con una segunda request autenticada como otro
        // usuario): el guard de Sanctum cachea el usuario resuelto en la primera request
        // del test y lo reutiliza en llamadas posteriores dentro del mismo método,
        // así que una segunda petición con otro token no reflejaría el cambio de usuario.
        $this->assertDatabaseHas('feature_spotlights_seen', [
            'user_id' => $admin->id,
            'feature_key' => 'role_permissions',
        ]);
        $this->assertDatabaseMissing('feature_spotlights_seen', [
            'user_id' => $employe->id,
            'feature_key' => 'role_permissions',
        ]);
    }
}
