<?php

namespace Tests\Orders;

use App\Enums\LayawayPaymentTypeEnum;
use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CustomerModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderLayawayPaymentModel;
use App\Models\OrderModel;
use App\Models\PaymentMethodModel;
use App\Models\User;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * Comprobante de apartado: GET /order/{id}/print/bytes y POST /order/{id}/print usan el formatter
 * de apartados cuando la orden tiene abonos, y el ticket de venta normal en cualquier otro caso.
 */
class LayawayTicketTest extends TestCase
{
    private function crearApartado(OrderStatusEnum $estatus, float $total = 487, float $abonado = 243): OrderModel
    {
        $tenantId = BusinessConfigModel::first()->id;
        $caja = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => $tenantId,
        ]);
        $customer = CustomerModel::create([
            CustomerModel::NAME => 'Maria Comprobante',
            CustomerModel::TENANT_ID => $tenantId,
        ]);

        $order = OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Apartado',
            OrderModel::TOTAL => $total,
            OrderModel::SUBTOTAL => $total,
            OrderModel::DESCUENTO => 0,
            OrderModel::ESTATUS_PEDIDO_ID => $estatus->value,
            OrderModel::SISTEMA_ID => $caja->id,
            OrderModel::CUSTOMER_ID => $customer->id,
            OrderModel::AMOUNT_PAID => $abonado,
            OrderModel::LAYAWAY_DUE_DATE => Carbon::today()->addDays(30)->toDateString(),
            OrderModel::TENANT_ID => $tenantId,
        ]);

        OrderLayawayPaymentModel::create([
            OrderLayawayPaymentModel::ORDER_ID => $order->id,
            OrderLayawayPaymentModel::CUSTOMER_ID => $customer->id,
            OrderLayawayPaymentModel::TYPE => LayawayPaymentTypeEnum::Deposit,
            OrderLayawayPaymentModel::AMOUNT => $abonado,
            OrderLayawayPaymentModel::PAYMENT_METHOD_ID => PaymentMethodModel::first()->id,
            OrderLayawayPaymentModel::SISTEMA_ID => $caja->id,
            OrderLayawayPaymentModel::TENANT_ID => $tenantId,
        ]);

        return $order;
    }

    private function bytes(OrderModel $order): string
    {
        return $this->get("/api/order/{$order->id}/print/bytes", array_merge($this->authHeaders(), ['Accept' => '*/*']))
            ->assertStatus(200)
            ->getContent();
    }

    public function test_comprobante_de_apartado_activo_muestra_abonos_saldo_y_fecha_limite(): void
    {
        $content = $this->bytes($this->crearApartado(OrderStatusEnum::LAYAWAY));

        $this->assertStringContainsString('COMPROBANTE DE APARTADO', $content);
        $this->assertStringContainsString('Maria Comprobante', $content);
        $this->assertStringContainsString('ABONOS', $content);
        $this->assertStringContainsString('+$243.00', $content);
        $this->assertStringContainsString('SALDO PENDIENTE:', $content);
        $this->assertStringContainsString('$244.00', $content);
        $this->assertStringContainsString('Fecha limite: '.Carbon::today()->addDays(30)->format('d/m/Y'), $content);
    }

    public function test_comprobante_de_apartado_liquidado_no_muestra_fecha_limite(): void
    {
        $content = $this->bytes($this->crearApartado(OrderStatusEnum::CLOSED, total: 487, abonado: 487));

        $this->assertStringContainsString('APARTADO LIQUIDADO', $content);
        $this->assertStringContainsString('SALDO PENDIENTE:', $content);
        $this->assertStringNotContainsString('Fecha limite', $content);
    }

    public function test_comprobante_de_apartado_cancelado_no_muestra_saldo(): void
    {
        $content = $this->bytes($this->crearApartado(OrderStatusEnum::CANCELED, abonado: 0));

        $this->assertStringContainsString('APARTADO CANCELADO', $content);
        $this->assertStringNotContainsString('SALDO PENDIENTE', $content);
    }

    public function test_una_venta_normal_sigue_imprimiendo_el_ticket_de_venta(): void
    {
        $order = $this->crearApartado(OrderStatusEnum::CLOSED);
        OrderLayawayPaymentModel::where(OrderLayawayPaymentModel::ORDER_ID, $order->id)->delete();

        $content = $this->bytes($order);

        $this->assertStringNotContainsString('APARTADO', $content);
        $this->assertStringContainsString('TOTAL:', $content);
    }
}
