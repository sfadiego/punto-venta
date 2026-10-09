<?php

namespace App\Services;

use App\Models\CustomerModel;
use Carbon\Carbon;
use Generator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Clientes con más adeudo (retail y venta por peso): el top por saldo, con qué parte del total por
 * cobrar pesa cada uno y cuánto llevan sin abonar. El adeudo es `customers.balance` (ventas a crédito
 * y cargos manuales, menos abonos); un apartado no entra: no es una deuda de crédito.
 */
class TopDebtorsService
{
    public const TOP = 10;

    /**
     * Resumen del adeudo de clientes: total por cobrar y cuántos deben. Lo usan Estadísticas (junto
     * al top) y la página de Clientes.
     *
     * @return array{total_balance: float, debtors_count: int}
     */
    public function summary(): array
    {
        $debt = CustomerModel::query()->where(CustomerModel::BALANCE, '>', 0);
        $totalBalance = round((float) (clone $debt)->sum(CustomerModel::BALANCE), 2);

        return [
            'total_balance' => $totalBalance,
            'debtors_count' => (clone $debt)->count(),
        ];
    }

    /**
     * @return array{summary: array{total_balance: float, debtors_count: int}, rows: array<int, array<string, mixed>>}
     */
    public function top(): array
    {
        $summary = $this->summary();

        return [
            'summary' => $summary,
            'rows' => $this->debtors()->limit(self::TOP)->get()
                ->map(fn (CustomerModel $customer): array => $this->row($customer, $summary['total_balance']))->all(),
        ];
    }

    /**
     * Todos los clientes con adeudo (no solo el top), de mayor a menor, para exportar. Recorre con
     * cursor para no cargar la cartera completa en memoria.
     *
     * @return Generator<int, array<string, mixed>>
     */
    public function allRows(): Generator
    {
        $totalBalance = $this->summary()['total_balance'];

        foreach ($this->debtors()->cursor() as $customer) {
            yield $this->row($customer, $totalBalance);
        }
    }

    /** Clientes con adeudo, con su último abono y fechas de primer cargo, de mayor a menor saldo. */
    private function debtors(): Builder
    {
        return CustomerModel::query()
            ->where(CustomerModel::BALANCE, '>', 0)
            ->select(['id', CustomerModel::NAME, CustomerModel::PHONE, CustomerModel::BALANCE])
            // Si además tiene apartados activos (retail): se muestra aparte, no es parte del adeudo.
            ->withLayawaySummary()
            ->selectSub(DB::table('customer_payments')->selectRaw('MAX(created_at)')->whereColumn('customer_id', 'customers.id'), 'last_payment_at')
            // Con qué fecha se cuenta "sin abonar" cuando nunca ha abonado: su primer cargo o venta a crédito.
            ->selectSub(DB::table('order')->selectRaw('MIN(credit_applied_at)')->whereColumn('customer_id', 'customers.id')->where('is_credit', true)->whereNull('deleted_at'), 'first_credit_at')
            ->selectSub(DB::table('customer_charges')->selectRaw('MIN(created_at)')->whereColumn('customer_id', 'customers.id'), 'first_charge_at')
            ->orderByDesc(CustomerModel::BALANCE)
            ->orderBy('id');
    }

    /** @return array<string, mixed> */
    private function row(CustomerModel $customer, float $totalBalance): array
    {
        $balance = round((float) $customer->balance, 2);
        // Referencia de "sin abonar": su último abono o, si nunca ha abonado, su primer cargo/venta a crédito.
        $reference = $customer->last_payment_at ?? collect([$customer->first_credit_at, $customer->first_charge_at])->filter()->sort()->first();

        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'phone' => $customer->phone,
            'balance' => $balance,
            'share_percent' => $totalBalance > 0 ? round($balance / $totalBalance * 100, 1) : 0.0,
            'last_payment_at' => $customer->last_payment_at,
            'layaway_count' => (int) $customer->layaway_count,
            'layaway_total' => (float) $customer->layaway_total,
            'layaway_paid' => (float) $customer->layaway_paid,
            'layaway_overdue_count' => (int) $customer->layaway_overdue_count,
            'days_without_payment' => $reference ? (int) Carbon::parse($reference)->startOfDay()->diffInDays(Carbon::today()) : null,
        ];
    }
}
