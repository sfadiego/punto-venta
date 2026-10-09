<?php

namespace Tests\Orders;

use App\Enums\BusinessTypeEnum;
use App\Enums\LayawayPaymentTypeEnum;
use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CustomerModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderLayawayPaymentModel;
use App\Models\OrderModel;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Búsqueda del listado de órdenes (GET /api/order?search=): por folio (nombre del pedido), id o
 * cliente. Con `strict_status` (página de Ventas) respeta el filtro de estatus; sin él conserva el
 * comportamiento de Pedidos, que busca entre órdenes activas y cerradas.
 */
class OrderSearchTest extends TestCase
{
    private MainOrderReportModel $caja;

    protected function setUp(): void
    {
        parent::setUp();

        // Retail: los apartados (y sus cancelaciones) solo existen ahí.
        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value]);

        $this->caja = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearOrden(string $folio, OrderStatusEnum $estatus, ?CustomerModel $customer = null, ?Carbon $fecha = null): OrderModel
    {
        $order = OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => $folio,
            OrderModel::TOTAL => 100,
            OrderModel::SUBTOTAL => 100,
            OrderModel::DESCUENTO => 0,
            OrderModel::ESTATUS_PEDIDO_ID => $estatus->value,
            OrderModel::SISTEMA_ID => $this->caja->id,
            OrderModel::CUSTOMER_ID => $customer?->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
        if ($fecha) {
            DB::table('order')->where('id', $order->id)->update(['created_at' => $fecha]);
        }

        return $order;
    }

    /** @return int[] ids de las órdenes devueltas */
    private function buscar(string $query): array
    {
        $response = $this->getJson("/api/order?{$query}", $this->authHeaders())->assertStatus(206);

        return collect($response->json('data'))->pluck('id')->all();
    }

    public function test_ventas_busca_por_folio_solo_entre_ordenes_cerradas(): void
    {
        $cerrada = $this->crearOrden('VTA-111111-AA', OrderStatusEnum::CLOSED);
        $this->crearOrden('VTA-111111-BB', OrderStatusEnum::IN_PROCESS);
        $this->crearOrden('VTA-222222-CC', OrderStatusEnum::CLOSED);

        $ids = $this->buscar('search=VTA-111111&estatus_pedido_id='.OrderStatusEnum::CLOSED->value.'&strict_status=1');

        $this->assertSame([$cerrada->id], $ids);
    }

    public function test_ventas_busca_por_nombre_de_cliente(): void
    {
        $maria = CustomerModel::create([CustomerModel::NAME => 'María Buscada', CustomerModel::TENANT_ID => BusinessConfigModel::first()->id]);
        $suya = $this->crearOrden('VTA-1', OrderStatusEnum::CLOSED, $maria);
        $this->crearOrden('VTA-2', OrderStatusEnum::CLOSED);

        $ids = $this->buscar('search=Buscada&estatus_pedido_id='.OrderStatusEnum::CLOSED->value.'&strict_status=1');

        $this->assertSame([$suya->id], $ids);
    }

    public function test_la_busqueda_de_ventas_respeta_el_periodo_elegido(): void
    {
        $hoy = $this->crearOrden('VTA-HOY', OrderStatusEnum::CLOSED);
        $this->crearOrden('VTA-HOY-VIEJA', OrderStatusEnum::CLOSED, fecha: Carbon::today()->subDays(10));

        $ids = $this->buscar('search=VTA-HOY&estatus_pedido_id='.OrderStatusEnum::CLOSED->value.'&strict_status=1&fecha='.Carbon::today()->toDateString());

        $this->assertSame([$hoy->id], $ids);
    }

    public function test_sin_strict_status_pedidos_busca_en_todas_las_ordenes_visibles(): void
    {
        $cerrada = $this->crearOrden('VTA-333333-AA', OrderStatusEnum::CLOSED);
        $enProceso = $this->crearOrden('VTA-333333-BB', OrderStatusEnum::IN_PROCESS);
        $apartada = $this->crearOrden('VTA-333333-CC', OrderStatusEnum::LAYAWAY);
        $cancelada = $this->crearOrden('VTA-333333-DD', OrderStatusEnum::CANCELED);
        $eliminada = $this->crearOrden('VTA-333333-EE', OrderStatusEnum::DELETED);

        // Estando en "Activos", un folio de un apartado o de una orden cancelada también se encuentra.
        $ids = $this->buscar('search=VTA-333333&estatus_pedido_id='.OrderStatusEnum::IN_PROCESS->value);

        $this->assertEqualsCanonicalizing([$cerrada->id, $enProceso->id, $apartada->id, $cancelada->id], $ids);
        $this->assertNotContains($eliminada->id, $ids);
    }

    public function test_en_otros_tipos_de_negocio_la_busqueda_no_mezcla_apartados_ni_canceladas(): void
    {
        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante->value]);
        $enProceso = $this->crearOrden('VTA-444444-AA', OrderStatusEnum::IN_PROCESS);
        $this->crearOrden('VTA-444444-BB', OrderStatusEnum::LAYAWAY);
        $this->crearOrden('VTA-444444-CC', OrderStatusEnum::CANCELED);

        $this->assertSame([$enProceso->id], $this->buscar('search=VTA-444444'));
    }

    public function test_layaways_only_se_ignora_fuera_de_retail(): void
    {
        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante->value]);
        $this->crearOrden('VTA-555555', OrderStatusEnum::CANCELED);

        $row = $this->getJson('/api/order?estatus_pedido_id='.OrderStatusEnum::CANCELED->value.'&layaways_only=1', $this->authHeaders())
            ->assertStatus(206)
            ->json('data.0');

        // No se agregan las sumas de apartados: el parámetro no aplica a este tipo de negocio.
        $this->assertArrayNotHasKey('layaway_deposited', $row);
    }

    public function test_el_tab_de_cancelados_lista_solo_apartados_cancelados_con_lo_reembolsado_y_retenido(): void
    {
        $customer = CustomerModel::create([CustomerModel::NAME => 'Cliente Cancelado', CustomerModel::TENANT_ID => BusinessConfigModel::first()->id]);
        $conRetencion = $this->crearOrden('VTA-CANC-1', OrderStatusEnum::CANCELED, $customer);
        $this->crearOrden('VTA-CANC-SIN-APARTADO', OrderStatusEnum::CANCELED);
        $this->crearOrden('VTA-ACTIVO', OrderStatusEnum::LAYAWAY, $customer);

        foreach ([[LayawayPaymentTypeEnum::Deposit, 300], [LayawayPaymentTypeEnum::Refund, 220], [LayawayPaymentTypeEnum::Forfeit, 80]] as [$type, $amount]) {
            OrderLayawayPaymentModel::create([
                OrderLayawayPaymentModel::ORDER_ID => $conRetencion->id,
                OrderLayawayPaymentModel::CUSTOMER_ID => $customer->id,
                OrderLayawayPaymentModel::TYPE => $type,
                OrderLayawayPaymentModel::AMOUNT => $amount,
                OrderLayawayPaymentModel::SISTEMA_ID => $this->caja->id,
                OrderLayawayPaymentModel::TENANT_ID => BusinessConfigModel::first()->id,
            ]);
        }

        $response = $this->getJson('/api/order?estatus_pedido_id='.OrderStatusEnum::CANCELED->value.'&layaways_only=1', $this->authHeaders())->assertStatus(206);

        $rows = collect($response->json('data'));
        $this->assertSame([$conRetencion->id], $rows->pluck('id')->all());
        $this->assertEquals(300, $rows[0]['layaway_deposited']);
        $this->assertEquals(220, $rows[0]['layaway_refunded']);
        $this->assertEquals(80, $rows[0]['layaway_retained']);
    }

    public function test_la_busqueda_dentro_del_tab_de_cancelados_solo_encuentra_cancelados(): void
    {
        $customer = CustomerModel::create([CustomerModel::NAME => 'Cliente X', CustomerModel::TENANT_ID => BusinessConfigModel::first()->id]);
        $cancelado = $this->crearOrden('VTA-ZZZ-1', OrderStatusEnum::CANCELED, $customer);
        $activo = $this->crearOrden('VTA-ZZZ-2', OrderStatusEnum::LAYAWAY, $customer);
        foreach ([$cancelado, $activo] as $order) {
            OrderLayawayPaymentModel::create([
                OrderLayawayPaymentModel::ORDER_ID => $order->id,
                OrderLayawayPaymentModel::CUSTOMER_ID => $customer->id,
                OrderLayawayPaymentModel::TYPE => LayawayPaymentTypeEnum::Deposit,
                OrderLayawayPaymentModel::AMOUNT => 50,
                OrderLayawayPaymentModel::SISTEMA_ID => $this->caja->id,
                OrderLayawayPaymentModel::TENANT_ID => BusinessConfigModel::first()->id,
            ]);
        }

        $ids = $this->buscar('search=VTA-ZZZ&estatus_pedido_id='.OrderStatusEnum::CANCELED->value.'&layaways_only=1&strict_status=1');

        $this->assertSame([$cancelado->id], $ids);
    }
}
