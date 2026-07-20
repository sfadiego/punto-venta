<?php

namespace Tests\Auth;

use App\Enums\RoleEnum;
use App\Enums\SubscriptionPlanEnum;
use App\Models\BusinessConfigModel;
use App\Models\User;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_login_con_credenciales_validas(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => env('APP_ADMIN_PASSWORD'),
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure([
                'status',
                'data' => ['access_token', 'user'],
            ]);
    }

    public function test_login_con_password_incorrecta(): void
    {
        // Email válido + password incorrecta → pasa validación, falla Auth::attempt → Response::error 422
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password_incorrecta',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error');
    }

    public function test_login_con_email_inexistente_falla_validacion(): void
    {
        // Email inexistente falla la regla exists:users,email → ValidationException → 400
        $response = $this->postJson('/api/auth/login', [
            'email' => 'noexiste@example.com',
            'password' => 'cualquiera',
        ]);

        $response->assertStatus(400);
    }

    public function test_login_requiere_email_y_password(): void
    {
        // Validación vacía → 400 (custom handler)
        $this->postJson('/api/auth/login', [])
            ->assertStatus(400);
    }

    public function test_rutas_protegidas_requieren_token(): void
    {
        $this->getJson('/api/category')->assertStatus(401);
    }

    // ── Register ─────────────────────────────────────────────

    public function test_registro_usuario_exitoso(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'nombre' => 'Test',
            'apellido_paterno' => 'User',
            'apellido_materno' => 'Doe',
            'email' => 'newuser@test.com',
            'usuario' => 'newuser_test',
            'rol_id' => RoleEnum::EMPLOYE->value,
            'password' => 'Test1234',
            'password_confirmation' => 'Test1234',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['status', 'data' => ['user', 'token']]);

        $this->assertDatabaseHas('users', ['email' => 'newuser@test.com']);
    }

    public function test_registro_requiere_campos_obligatorios(): void
    {
        $this->postJson('/api/auth/register', [])
            ->assertStatus(400);
    }

    public function test_registro_email_duplicado(): void
    {
        $existing = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->postJson('/api/auth/register', [
            'nombre' => 'Duplicado',
            'apellido_paterno' => 'Test',
            'email' => $existing->email,
            'usuario' => 'otro_usuario_unico',
            'rol_id' => RoleEnum::EMPLOYE->value,
            'password' => 'Test1234',
            'password_confirmation' => 'Test1234',
        ])->assertStatus(400);
    }

    public function test_registro_password_debe_tener_letras_y_numeros(): void
    {
        $this->postJson('/api/auth/register', [
            'nombre' => 'Test',
            'apellido_paterno' => 'User',
            'email' => 'validpwd@test.com',
            'usuario' => 'validpwd_test',
            'rol_id' => RoleEnum::EMPLOYE->value,
            'password' => 'sololetras',
            'password_confirmation' => 'sololetras',
        ])->assertStatus(400);
    }

    // ── Logout ───────────────────────────────────────────────

    public function test_logout_cierra_sesion(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();
        $tokensBefore = $user->tokens()->count();

        // authHeaders crea 1 token; logout lo elimina; el conteo vuelve al original
        $this->postJson('/api/auth/logout', [], $this->authHeaders($user))
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertEquals($tokensBefore, $user->fresh()->tokens()->count());
    }

    public function test_logout_sin_token_falla(): void
    {
        $this->postJson('/api/auth/logout', [])->assertStatus(401);
    }

    // ── Login con slug ────────────────────────────────────────

    public function test_login_con_slug_valido(): void
    {
        $tenant = BusinessConfigModel::first();
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => env('APP_ADMIN_PASSWORD'),
            'slug' => $tenant->slug,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_login_con_slug_de_otro_tenant_falla(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => env('APP_ADMIN_PASSWORD'),
            'slug' => 'slug-que-no-existe',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error');
    }

    // ── Sesiones simultáneas ─────────────────────────────────

    public function test_login_desde_segundo_dispositivo_no_invalida_primera_sesion(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();
        $password = env('APP_ADMIN_PASSWORD');

        // Primer login (dispositivo A)
        $responseA = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => $password,
        ]);
        $responseA->assertStatus(200);
        $tokenA = $responseA->json('data.access_token');

        // Segundo login (dispositivo B)
        $responseB = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => $password,
        ]);
        $responseB->assertStatus(200);

        // El token del dispositivo A sigue siendo válido (no 401 Unauthorized)
        $this->getJson('/api/category', ['Authorization' => "Bearer $tokenA"])
            ->assertSuccessful();
    }

    public function test_login_crea_token_nuevo_sin_borrar_los_existentes(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $tokensBefore = $user->tokens()->count();

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => env('APP_ADMIN_PASSWORD'),
        ])->assertStatus(200);

        // Debe haber exactamente un token más que antes
        $this->assertEquals($tokensBefore + 1, $user->fresh()->tokens()->count());
    }

    // ── Límite de usuarios simultáneos ───────────────────────

    public function test_login_bloquea_cuando_se_alcanza_limite_de_usuarios_simultaneos(): void
    {
        $tenant = BusinessConfigModel::first();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        // Plan Weekly (máximo 2 usuarios) con suscripción activa
        $tenant->update([
            BusinessConfigModel::SUBSCRIPTION_PLAN => SubscriptionPlanEnum::Weekly->value,
            'subscription_expires_at' => now()->addDays(7),
        ]);

        // Crear 2 usuarios activos del mismo tenant (distintos al admin)
        User::factory()->count(2)->create([
            User::TENANT_ID => $tenant->id,
            User::LAST_SEEN_AT => now(),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $admin->email,
            'password' => env('APP_ADMIN_PASSWORD'),
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('code', 'CONCURRENT_USERS_LIMIT');
    }

    public function test_login_permite_acceso_cuando_no_se_supera_el_limite(): void
    {
        $tenant = BusinessConfigModel::first();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        // Plan Weekly (máximo 2 usuarios) con suscripción activa
        $tenant->update([
            BusinessConfigModel::SUBSCRIPTION_PLAN => SubscriptionPlanEnum::Weekly->value,
            'subscription_expires_at' => now()->addDays(7),
        ]);

        // Solo 1 usuario activo → activeCount (1) < maxUsers (2) → debe pasar
        User::factory()->create([
            User::TENANT_ID => $tenant->id,
            User::LAST_SEEN_AT => now(),
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $admin->email,
            'password' => env('APP_ADMIN_PASSWORD'),
        ])->assertStatus(200)->assertJsonPath('status', 'OK');
    }

    public function test_usuarios_inactivos_no_cuentan_para_el_limite(): void
    {
        $tenant = BusinessConfigModel::first();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $tenant->update([
            BusinessConfigModel::SUBSCRIPTION_PLAN => SubscriptionPlanEnum::Weekly->value,
            'subscription_expires_at' => now()->addDays(7),
        ]);

        // 2 usuarios con last_seen_at fuera de la ventana activa (más de 15 min)
        User::factory()->count(2)->create([
            User::TENANT_ID => $tenant->id,
            User::LAST_SEEN_AT => now()->subMinutes(20),
        ]);

        // Deben ser ignorados → login debe pasar
        $this->postJson('/api/auth/login', [
            'email' => $admin->email,
            'password' => env('APP_ADMIN_PASSWORD'),
        ])->assertStatus(200)->assertJsonPath('status', 'OK');
    }

    public function test_limite_manual_sobreescribe_limite_del_plan_bloqueando_login(): void
    {
        $tenant = BusinessConfigModel::first();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        // Plan Weekly permite 2, pero max_users manual fija 1
        $tenant->update([
            BusinessConfigModel::SUBSCRIPTION_PLAN => SubscriptionPlanEnum::Weekly->value,
            BusinessConfigModel::MAX_USERS => 1,
            'subscription_expires_at' => now()->addDays(7),
        ]);

        // 1 usuario activo → activeCount (1) >= effectiveMaxUsers (1) → debe bloquear
        User::factory()->create([
            User::TENANT_ID => $tenant->id,
            User::LAST_SEEN_AT => now(),
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $admin->email,
            'password' => env('APP_ADMIN_PASSWORD'),
        ])->assertStatus(403)
            ->assertJsonPath('code', 'CONCURRENT_USERS_LIMIT');
    }

    public function test_limite_manual_sobreescribe_limite_del_plan_permitiendo_mas_sesiones(): void
    {
        $tenant = BusinessConfigModel::first();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        // Plan Weekly permite 2, pero max_users manual lo sube a 5
        $tenant->update([
            BusinessConfigModel::SUBSCRIPTION_PLAN => SubscriptionPlanEnum::Weekly->value,
            BusinessConfigModel::MAX_USERS => 5,
            'subscription_expires_at' => now()->addDays(7),
        ]);

        // 3 usuarios activos → activeCount (3) < effectiveMaxUsers (5) → debe pasar
        User::factory()->count(3)->create([
            User::TENANT_ID => $tenant->id,
            User::LAST_SEEN_AT => now(),
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $admin->email,
            'password' => env('APP_ADMIN_PASSWORD'),
        ])->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_limite_default_sin_plan_ni_max_users_es_2(): void
    {
        $tenant = BusinessConfigModel::first();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $tenant->update([
            BusinessConfigModel::SUBSCRIPTION_PLAN => null,
            BusinessConfigModel::MAX_USERS => null,
            'subscription_expires_at' => now()->addDays(7),
        ]);

        // 2 usuarios activos → activeCount (2) >= effectiveMaxUsers (2 default) → bloquea
        User::factory()->count(2)->create([
            User::TENANT_ID => $tenant->id,
            User::LAST_SEEN_AT => now(),
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $admin->email,
            'password' => env('APP_ADMIN_PASSWORD'),
        ])->assertStatus(403)
            ->assertJsonPath('code', 'CONCURRENT_USERS_LIMIT');
    }

    // ── Login bloquea SuperAdmin ──────────────────────────────

    public function test_login_bloquea_superadmin(): void
    {
        $superadmin = User::where('rol_id', RoleEnum::SUPERADMIN->value)->first();

        if (! $superadmin) {
            $this->markTestSkipped('No hay usuario superadmin en el seed.');
        }

        $response = $this->postJson('/api/auth/login', [
            'email' => $superadmin->email,
            'password' => env('APP_ADMIN_PASSWORD'),
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error');
    }

    // ── Rate limiting ─────────────────────────────────────────

    public function test_login_bloquea_tras_superar_el_limite_de_intentos(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', [
                'email' => $user->email,
                'password' => 'password_incorrecta',
            ])->assertStatus(422);
        }

        // 6to intento en el mismo minuto → bloqueado por el rate limiter
        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password_incorrecta',
        ])->assertStatus(429);
    }

    public function test_login_limite_es_independiente_por_email(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', [
                'email' => $user->email,
                'password' => 'password_incorrecta',
            ]);
        }

        // Un email distinto desde la misma IP no debe estar bloqueado
        $this->postJson('/api/auth/login', [
            'email' => 'otro-usuario-no-existe@test.com',
            'password' => 'cualquiera',
        ])->assertStatus(400);
    }

    public function test_registro_bloquea_tras_superar_el_limite_de_intentos(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/register', [
                'nombre' => 'Test',
                'apellido_paterno' => 'User',
                'email' => 'ratelimit'.$i.'@test.com',
                'usuario' => 'ratelimit_'.$i,
                'rol_id' => RoleEnum::EMPLOYE->value,
                'password' => 'Test1234',
                'password_confirmation' => 'Test1234',
            ])->assertStatus(200);
        }

        // 6to registro en el mismo minuto → bloqueado por el rate limiter
        $this->postJson('/api/auth/register', [
            'nombre' => 'Test',
            'apellido_paterno' => 'User',
            'email' => 'ratelimit-extra@test.com',
            'usuario' => 'ratelimit_extra',
            'rol_id' => RoleEnum::EMPLOYE->value,
            'password' => 'Test1234',
            'password_confirmation' => 'Test1234',
        ])->assertStatus(429);
    }
}
