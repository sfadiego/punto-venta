<?php

namespace Tests\Feature\System;

use App\Enums\MainOrderStatusEnum;
use App\Models\MainOrderReportModel;
use App\Models\User;
use Tests\TestCase;

class ActiveSaleTest extends TestCase
{
    private function crearCajaAbierta(): MainOrderReportModel
    {
        $user = User::where('rol_id', 1)->first();

        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500.00,
            MainOrderReportModel::OBSERVACION => '',
            MainOrderReportModel::USER_ID => $user->id,
        ]);
    }

    public function test_retorna_null_cuando_no_hay_caja_abierta(): void
    {
        $this->getJson('/api/admin/system/active-sale', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data', null);
    }

    public function test_retorna_caja_activa_cuando_existe(): void
    {
        $caja = $this->crearCajaAbierta();

        $this->getJson('/api/admin/system/active-sale', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.id', $caja->id)
            ->assertJsonStructure(['data' => ['id', 'estatus_caja', 'user']]);
    }

    public function test_sin_autenticacion_retorna_401(): void
    {
        $this->getJson('/api/admin/system/active-sale')
            ->assertStatus(401);
    }
}
