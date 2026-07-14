<?php

namespace Tests\Admin;

use App\Models\MainOrderReportModel;
use Tests\TestCase;

class StatisticsTest extends TestCase
{
    // ── Best seller ───────────────────────────────────────────

    public function test_retorna_top3_sin_filtros(): void
    {
        $this->getJson('/api/admin/system/statistics/best-seller', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['data']);
    }

    public function test_retorna_top3_con_fecha(): void
    {
        $this->getJson(
            '/api/admin/system/statistics/best-seller?date=' . now()->format('Y-m'),
            $this->authHeaders()
        )
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_retorna_top3_con_sistema_id(): void
    {
        $caja = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA        => 'open',
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID             => 1,
        ]);

        $this->getJson(
            "/api/admin/system/statistics/best-seller?sistema_id={$caja->id}",
            $this->authHeaders()
        )
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_data_es_array(): void
    {
        $response = $this->getJson('/api/admin/system/statistics/best-seller', $this->authHeaders())
            ->assertStatus(200);

        $this->assertIsArray($response->json('data'));
    }

    public function test_sin_autenticacion(): void
    {
        $this->getJson('/api/admin/system/statistics/best-seller')->assertStatus(401);
    }

    public function test_sistema_id_cero_es_ignorado(): void
    {
        // sistema_id=0 → se convierte a null → retorna estadísticas globales
        $this->getJson('/api/admin/system/statistics/best-seller?sistema_id=0', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }
}
