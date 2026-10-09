<?php

namespace Tests\System;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\PaymentMethodModel;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Control de aperturas y cierres de caja: una caja sin ventas se puede cerrar (un día sin ventas es
 * legítimo en cualquier negocio) pero con motivo, y quedan guardados quién y cuándo cerró; además hay
 * un tope de aperturas por día y sucursal para evitar abrir y cerrar sin control.
 */
class CloseSalesEmptySessionTest extends TestCase
{
    private function crearCaja(MainOrderStatusEnum $estatus = MainOrderStatusEnum::OPEN, float $inicio = 200): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => $estatus,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => $inicio,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function cerrar(MainOrderReportModel $caja, array $data = [])
    {
        return $this->postJson("/api/admin/system/{$caja->id}/close", $data, $this->authHeaders());
    }

    private function abrir()
    {
        return $this->postJson('/api/admin/system/open', [
            'user_id' => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            'efectivo_caja_inicio' => 100,
        ], $this->authHeaders());
    }

    // ── Cierre sin ventas ────────────────────────────────────

    public function test_caja_sin_ventas_se_cierra_con_motivo_y_queda_auditada(): void
    {
        $caja = $this->crearCaja();

        $this->cerrar($caja, ['empty_close_reason' => 'Día festivo, la tienda no abrió'])->assertStatus(200);

        $caja->refresh();
        $this->assertSame(MainOrderStatusEnum::CLOSED->value, (int) $caja->estatus_caja);
        $this->assertSame('Día festivo, la tienda no abrió', $caja->empty_close_reason);
        $this->assertSame(User::where('rol_id', RoleEnum::ADMIN->value)->first()->id, $caja->closed_by);
        $this->assertNotNull($caja->closed_at);
        $this->assertEquals(200, (float) $caja->efectivo_caja_cierre);
    }

    public function test_el_motivo_no_puede_ser_vacio_ni_demasiado_corto(): void
    {
        $caja = $this->crearCaja();

        $this->cerrar($caja, ['empty_close_reason' => '   '])->assertStatus(422);
        $this->cerrar($caja, ['empty_close_reason' => 'no'])->assertStatus(400);

        $this->assertSame(MainOrderStatusEnum::OPEN->value, (int) $caja->fresh()->estatus_caja);
    }

    public function test_caja_con_ventas_no_exige_motivo_y_registra_quien_y_cuando_cerro(): void
    {
        $caja = $this->crearCaja();
        OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Venta',
            OrderModel::TOTAL => 100,
            OrderModel::SUBTOTAL => 100,
            OrderModel::DESCUENTO => 0,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            OrderModel::PAYMENT_METHOD_ID => PaymentMethodModel::first()->id,
            OrderModel::SISTEMA_ID => $caja->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        // Un motivo enviado sin necesitarlo se ignora: solo las sesiones vacías lo guardan.
        $this->cerrar($caja, ['empty_close_reason' => 'no hace falta'])->assertStatus(200);

        $caja->refresh();
        $this->assertNull($caja->empty_close_reason);
        $this->assertNotNull($caja->closed_by);
        $this->assertNotNull($caja->closed_at);
    }

    public function test_el_cierre_conserva_la_prioridad_de_sus_otros_errores(): void
    {
        $caja = $this->crearCaja(MainOrderStatusEnum::CLOSED);

        // Ya cerrada: responde ese error y no pide motivo.
        $this->cerrar($caja)->assertStatus(422)->assertJsonPath('message', 'sistema cerrado previamente.');
    }

    // ── Límite de aperturas por día ──────────────────────────

    public function test_se_pueden_abrir_hasta_el_limite_de_cajas_por_dia(): void
    {
        for ($i = 1; $i < MainOrderReportModel::MAX_OPENINGS_PER_DAY; $i++) {
            $this->crearCaja(MainOrderStatusEnum::CLOSED);
        }

        $this->abrir()->assertStatus(200);
    }

    public function test_al_llegar_al_limite_de_aperturas_del_dia_no_se_puede_abrir_otra(): void
    {
        for ($i = 0; $i < MainOrderReportModel::MAX_OPENINGS_PER_DAY; $i++) {
            $this->crearCaja(MainOrderStatusEnum::CLOSED);
        }

        $this->abrir()
            ->assertStatus(422)
            ->assertJsonPath('message', 'Se alcanzó el límite de '.MainOrderReportModel::MAX_OPENINGS_PER_DAY.' aperturas de caja por día.');

        $this->assertSame(MainOrderReportModel::MAX_OPENINGS_PER_DAY, MainOrderReportModel::count());
    }

    public function test_las_aperturas_de_dias_anteriores_no_cuentan_para_el_limite(): void
    {
        for ($i = 0; $i < MainOrderReportModel::MAX_OPENINGS_PER_DAY; $i++) {
            $caja = $this->crearCaja(MainOrderStatusEnum::CLOSED);
            DB::table('main_order_report')->where('id', $caja->id)->update(['created_at' => Carbon::yesterday()->setTime(10, 0)]);
        }

        $this->abrir()->assertStatus(200);
    }

    public function test_una_caja_abierta_sigue_bloqueando_otra_apertura_antes_del_limite(): void
    {
        $this->crearCaja();

        $this->abrir()->assertStatus(422)->assertJsonPath('message', 'Existe una session de ventas activa');
    }
}
