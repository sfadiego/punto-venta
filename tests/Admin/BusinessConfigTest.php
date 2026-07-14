<?php

namespace Tests\Admin;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BusinessConfigTest extends TestCase
{
    // ── Show ─────────────────────────────────────────────────

    public function test_muestra_config_del_negocio(): void
    {
        $this->getJson('/api/admin/config', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'business_name',
                    'primary_color',
                    'sidebar_color',
                    'font_color',
                    'label_color',
                    'logo_upload_enabled',
                    'features',
                ],
            ]);
    }

    public function test_config_sin_autenticacion(): void
    {
        $this->getJson('/api/admin/config')->assertStatus(401);
    }

    // ── Update ───────────────────────────────────────────────

    public function test_actualiza_config_del_negocio(): void
    {
        $this->putJson('/api/admin/config', [
            'business_name' => 'Mi Negocio Actualizado',
            'primary_color' => '#FF5733',
            'sidebar_color' => '#1C1917',
            'font_color'    => '#FFFFFF',
            'label_color'   => '#000000',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.business_name', 'Mi Negocio Actualizado')
            ->assertJsonPath('data.primary_color', '#FF5733');
    }

    public function test_actualiza_campos_opcionales(): void
    {
        $this->putJson('/api/admin/config', [
            'business_name' => 'Cafe Test',
            'primary_color' => '#F59E0B',
            'sidebar_color' => '#1C1917',
            'font_color'    => '#FFFFFF',
            'label_color'   => '#1C1917',
            'phone'         => '3001234567',
            'address'       => 'Calle 123',
            'facebook'      => 'mi-cafe',
            'instagram'     => '@mi-cafe',
            'whatsapp'      => '3009876543',
            'website'       => 'https://micafe.com',
            'ticket_footer' => 'Gracias por su visita',
            'menu_enabled'  => true,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.phone', '3001234567')
            ->assertJsonPath('data.menu_enabled', true);
    }

    public function test_no_actualiza_sin_business_name(): void
    {
        $this->putJson('/api/admin/config', [
            'primary_color' => '#FF5733',
            'sidebar_color' => '#1C1917',
            'font_color'    => '#FFFFFF',
            'label_color'   => '#000000',
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_actualiza_con_color_invalido(): void
    {
        $this->putJson('/api/admin/config', [
            'business_name' => 'Test',
            'primary_color' => 'rojo',   // no es hex válido
            'sidebar_color' => '#1C1917',
            'font_color'    => '#FFFFFF',
            'label_color'   => '#000000',
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_actualiza_con_website_invalido(): void
    {
        $this->putJson('/api/admin/config', [
            'business_name' => 'Test',
            'primary_color' => '#FF5733',
            'sidebar_color' => '#1C1917',
            'font_color'    => '#FFFFFF',
            'label_color'   => '#000000',
            'website'       => 'no-es-una-url',
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_actualiza_config_sin_autenticacion(): void
    {
        $this->putJson('/api/admin/config', [
            'business_name' => 'Test',
            'primary_color' => '#FF5733',
            'sidebar_color' => '#1C1917',
            'font_color'    => '#FFFFFF',
            'label_color'   => '#000000',
        ])->assertStatus(401);
    }

    // ── Logo upload ───────────────────────────────────────────

    public function test_sube_logo(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('logo.png', 100, 100);

        $this->postJson('/api/admin/config/logo', ['logo' => $file], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_no_sube_logo_sin_archivo(): void
    {
        $this->postJson('/api/admin/config/logo', [], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_sube_logo_con_tipo_invalido(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

        $this->postJson('/api/admin/config/logo', ['logo' => $file], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_sube_logo_sin_autenticacion(): void
    {
        Storage::fake('public');
        $file = UploadedFile::fake()->image('logo.png');

        $this->postJson('/api/admin/config/logo', ['logo' => $file])
            ->assertStatus(401);
    }

    // ── Remove logo ───────────────────────────────────────────

    public function test_elimina_logo(): void
    {
        $this->deleteJson('/api/admin/config/logo', [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_elimina_logo_sin_autenticacion(): void
    {
        $this->deleteJson('/api/admin/config/logo')->assertStatus(401);
    }

    // ── Subscription status ───────────────────────────────────

    public function test_retorna_estado_suscripcion(): void
    {
        $this->getJson('/api/admin/config/subscription-status', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure([
                'data' => [
                    'status',
                    'plan',
                    'expires_at',
                    'business_name',
                ],
            ]);
    }

    public function test_suscripcion_activa_con_plan_lifetime(): void
    {
        $response = $this->getJson('/api/admin/config/subscription-status', $this->authHeaders())
            ->assertStatus(200);

        // setUp() en TestCase setea el plan a lifetime
        $this->assertEquals('active', $response->json('data.status'));
        $this->assertEquals('lifetime', $response->json('data.plan'));
    }

    public function test_estado_suscripcion_sin_autenticacion(): void
    {
        $this->getJson('/api/admin/config/subscription-status')->assertStatus(401);
    }
}
