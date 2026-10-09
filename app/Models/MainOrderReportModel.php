<?php

namespace App\Models;

use App\Enums\LayawayPaymentTypeEnum;
use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Models\Traits\HasTenant;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MainOrderReportModel extends Model
{
    use HasFactory, HasTenant;

    protected $table = 'main_order_report';

    const ESTATUS_CAJA = 'estatus_caja';

    const EFECTIVO_CAJA_INICIO = 'efectivo_caja_inicio';

    const EFECTIVO_CAJA_CIERRE = 'efectivo_caja_cierre';

    const VENTA_DIA = 'venta_dia';

    const OBSERVACION = 'observaciones';

    const USER_ID = 'user_id';

    const TENANT_ID = 'tenant_id';

    const BRANCH_ID = 'branch_id';

    const CLOSED_BY = 'closed_by';

    const CLOSED_AT = 'closed_at';

    const EMPTY_CLOSE_REASON = 'empty_close_reason';

    // Tope de aperturas de caja por sucursal y día — evita abrir y cerrar sesiones sin control.
    // Holgado a propósito: cubre turnos y reaperturas legítimas.
    const MAX_OPENINGS_PER_DAY = 3;

    // Movimientos de apartados que mueven dinero en la caja: abonos y reembolsos. La retención
    // (forfeit) queda en el historial, pero no suma ni resta efectivo.
    private const LAYAWAY_CASH_TYPES = [LayawayPaymentTypeEnum::Deposit, LayawayPaymentTypeEnum::Refund];

    protected $fillable = [
        self::ESTATUS_CAJA,
        self::EFECTIVO_CAJA_INICIO,
        self::EFECTIVO_CAJA_CIERRE,
        self::VENTA_DIA,
        self::OBSERVACION,
        self::USER_ID,
        self::TENANT_ID,
        self::BRANCH_ID,
        self::CLOSED_BY,
        self::CLOSED_AT,
        self::EMPTY_CLOSE_REASON,
    ];

    protected $casts = [
        self::CLOSED_AT => 'datetime',
    ];

    public function orders()
    {
        return $this->hasMany(OrderModel::class, 'sistema_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(BranchModel::class, self::BRANCH_ID);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(ExpenseModel::class, 'sistema_id');
    }

    public function user()
    {
        return $this->hasOne(User::class, 'id', 'user_id');
    }

    public function updateCurrentSales()
    {
        $totalSales = $this->totalSalesByDay();
        $currentTotal = $this->efectivo_caja_inicio;
        $this->update([
            'efectivo_caja_cierre' => $currentTotal,
            'venta_dia' => $totalSales,
        ]);

        return $this->refresh();
    }

    /**
     * Dinero que entró en esta sesión: ventas cerradas completas + movimiento neto de apartados
     * (abonos menos reembolsos recibidos/devueltos en esta caja) − devoluciones de venta reembolsadas
     * en esta caja. Un apartado liquidado NO suma su total aquí — solo lo abonado en esta sesión; el
     * resto ya entró en las sesiones anteriores.
     */
    public function totalSalesByDay(): float
    {
        return (float) round(
            $this->closedSalesQuery()->sum('total') + $this->layawaySummary()['neto'] - $this->returnsSummary()['total'],
            2
        );
    }

    /**
     * Devoluciones de venta reembolsadas en esta sesión: `total` es todo lo devuelto al cliente y
     * `balance_applied` la parte que bajó su saldo de crédito (no salió de la caja); `cash_out` es lo
     * que salió por métodos de pago.
     *
     * @return array{total: float, balance_applied: float, cash_out: float, count: int}
     */
    public function returnsSummary(): array
    {
        $totals = OrderReturnModel::where(OrderReturnModel::SISTEMA_ID, $this->id)
            ->selectRaw('ROUND(SUM(refund_amount), 2) as total, ROUND(SUM(balance_applied), 2) as balance_applied, COUNT(*) as returns_count')
            ->first();

        $total = (float) ($totals->total ?? 0);
        $balance = (float) ($totals->balance_applied ?? 0);

        return [
            'total' => $total,
            'balance_applied' => $balance,
            'cash_out' => round($total - $balance, 2),
            'count' => (int) ($totals->returns_count ?? 0),
        ];
    }

    public function hasReturnMovements(): bool
    {
        return OrderReturnModel::where(OrderReturnModel::SISTEMA_ID, $this->id)->exists();
    }

    /**
     * Órdenes cerradas de la sesión que no pasaron por un apartado — su dinero entró completo al
     * cerrarse. Las que sí pasaron por un apartado se cuentan por sus abonos (layawaySummary).
     */
    private function closedSalesQuery(): Builder
    {
        return OrderModel::where('sistema_id', $this->id)
            ->where('estatus_pedido_id', OrderStatusEnum::CLOSED->value)
            ->whereNull('deleted_at')
            ->whereDoesntHave('layawayPayments');
    }

    /** @return array{abonos: float, reembolsos: float, neto: float} */
    public function layawaySummary(): array
    {
        $totals = OrderLayawayPaymentModel::where(OrderLayawayPaymentModel::SISTEMA_ID, $this->id)
            ->selectRaw('type, ROUND(SUM(amount), 2) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $deposits = (float) ($totals[LayawayPaymentTypeEnum::Deposit->value] ?? 0);
        $refunds = (float) ($totals[LayawayPaymentTypeEnum::Refund->value] ?? 0);

        return [
            'abonos' => $deposits,
            'reembolsos' => $refunds,
            'neto' => round($deposits - $refunds, 2),
        ];
    }

    public function hasLayawayMovements(): bool
    {
        return OrderLayawayPaymentModel::where(OrderLayawayPaymentModel::SISTEMA_ID, $this->id)
            ->whereIn(OrderLayawayPaymentModel::TYPE, self::LAYAWAY_CASH_TYPES)
            ->exists();
    }

    /**
     * Totales por método de pago: ventas cerradas completas + movimiento neto de apartados de la
     * sesión (abonos suman, reembolsos restan) — de ahí sale el efectivo físico esperado en caja.
     * La propina solo existe en ventas normales.
     */
    public function totalByPaymentMethod(): array
    {
        $byMethod = [];

        $orders = $this->closedSalesQuery()
            ->selectRaw('payment_method_id, ROUND(SUM(total), 2) as total, ROUND(SUM(propina), 2) as propina')
            ->groupBy('payment_method_id')
            ->with('paymentMethod:id,name')
            ->get();

        foreach ($orders as $order) {
            $byMethod[$order->payment_method_id] = [
                'payment_method_id' => $order->payment_method_id,
                'name' => $order->paymentMethod?->name ?? 'Sin método',
                'total' => (float) $order->total,
                'propina' => (float) $order->propina,
            ];
        }

        $movements = OrderLayawayPaymentModel::where(OrderLayawayPaymentModel::SISTEMA_ID, $this->id)
            ->whereIn(OrderLayawayPaymentModel::TYPE, self::LAYAWAY_CASH_TYPES)
            ->selectRaw('payment_method_id, ROUND(SUM(CASE WHEN type = ? THEN amount ELSE -amount END), 2) as total', [LayawayPaymentTypeEnum::Deposit->value])
            ->groupBy('payment_method_id')
            ->with('paymentMethod:id,name')
            ->get();

        foreach ($movements as $movement) {
            $methodId = $movement->payment_method_id;
            $byMethod[$methodId] ??= [
                'payment_method_id' => $methodId,
                'name' => $movement->paymentMethod?->name ?? 'Sin método',
                'total' => 0.0,
                'propina' => 0.0,
            ];
            $byMethod[$methodId]['total'] = round($byMethod[$methodId]['total'] + (float) $movement->total, 2);
        }

        // Devoluciones: lo que salió por método baja el total de ese método; lo que bajó el saldo de
        // crédito de un cliente baja el grupo de ventas a crédito (sin método), igual que la venta que revierte.
        $returns = OrderReturnModel::where(OrderReturnModel::SISTEMA_ID, $this->id)
            ->selectRaw('refund_payment_method_id, ROUND(SUM(refund_amount - balance_applied), 2) as method_total, ROUND(SUM(balance_applied), 2) as balance_total')
            ->groupBy('refund_payment_method_id')
            ->with('refundPaymentMethod:id,name')
            ->get();

        foreach ($returns as $return) {
            foreach ([[$return->refund_payment_method_id, (float) $return->method_total], [null, (float) $return->balance_total]] as [$methodId, $amount]) {
                if ($amount <= 0) {
                    continue;
                }

                $byMethod[$methodId] ??= [
                    'payment_method_id' => $methodId,
                    'name' => $methodId ? ($return->refundPaymentMethod?->name ?? 'Sin método') : 'Sin método',
                    'total' => 0.0,
                    'propina' => 0.0,
                ];
                $byMethod[$methodId]['total'] = round($byMethod[$methodId]['total'] - $amount, 2);
            }
        }

        return array_values($byMethod);
    }

    public function totalPropinasByDay(): float
    {
        return (float) round(
            OrderModel::where('sistema_id', $this->id)
                ->where('estatus_pedido_id', OrderStatusEnum::CLOSED->value)
                ->whereNull('deleted_at')
                ->sum('propina'),
            2
        );
    }

    public function totalDomiciliosByDay(): float
    {
        // Solo los valores negativos (negocio absorbe el costo de envío).
        // costo_domicilio > 0 = cliente paga a través del POS (no afecta el neto del negocio).
        // costo_domicilio < 0 = negocio absorbe (se descuenta del neto en el corte).
        return (float) round(
            OrderModel::where('sistema_id', $this->id)
                ->where('estatus_pedido_id', OrderStatusEnum::CLOSED->value)
                ->where('costo_domicilio', '<', 0)
                ->selectRaw('ABS(SUM(costo_domicilio)) as total')
                ->value('total') ?? 0,
            2
        );
    }

    public function totalExpensesByDay(): float
    {
        return (float) round(
            ExpenseModel::where(ExpenseModel::SISTEMA_ID, $this->id)->sum(ExpenseModel::MONTO),
            2
        );
    }

    /** Sesión sin ventas, abonos/reembolsos de apartados ni devoluciones — cerrarla exige un motivo. */
    public function isEmptySession(): bool
    {
        return $this->totalSalesByDay() == 0 && ! $this->hasLayawayMovements() && ! $this->hasReturnMovements();
    }

    /** Aperturas de caja de hoy (abiertas o cerradas) en la sucursal, o en todo el negocio sin sucursal. */
    public static function openingsToday(?int $branchId = null): int
    {
        return static::query()
            ->when($branchId, fn ($q) => $q->where(self::BRANCH_ID, $branchId))
            ->whereDate(self::CREATED_AT, Carbon::today())
            ->count();
    }

    public function closeSales(?string $emptyCloseReason = null): MainOrderReportModel
    {
        $initialCash = $this->efectivo_caja_inicio;
        $totalBruto = $this->totalSalesByDay();
        $totalDomicilio = $this->totalDomiciliosByDay();
        $totalGastos = $this->totalExpensesByDay();

        $this->update([
            self::VENTA_DIA => $totalBruto,
            self::EFECTIVO_CAJA_CIERRE => $initialCash + $totalBruto - $totalDomicilio - $totalGastos,
            self::ESTATUS_CAJA => MainOrderStatusEnum::CLOSED,
            self::CLOSED_BY => auth()->id(),
            self::CLOSED_AT => now(),
            self::EMPTY_CLOSE_REASON => $emptyCloseReason,
        ]);

        return $this->refresh();
    }

    /**
     * Sin $branchId (tenants sin sucursales, o llamadores que no la conocen) se comporta
     * igual que antes: una sola caja abierta por tenant. Con $branchId, la validación se
     * acota a esa sucursal — permite que dos sucursales del mismo tenant tengan cada una
     * su propia caja abierta simultáneamente.
     */
    public static function validateIfOpenSaleActive(?int $branchId = null): bool
    {
        return MainOrderReportModel::where(self::ESTATUS_CAJA, MainOrderStatusEnum::OPEN)
            ->when($branchId, fn ($q) => $q->where(self::BRANCH_ID, $branchId))
            ->exists();
    }

    public function getActiveSale(?int $branchId = null): ?MainOrderReportModel
    {
        return MainOrderReportModel::with('user')
            ->where(self::ESTATUS_CAJA, MainOrderStatusEnum::OPEN)
            ->when($branchId, fn ($q) => $q->where(self::BRANCH_ID, $branchId))
            ->first();
    }

    public static function openSales(
        float $initialCash,
        int $userId,
        string $observaciones = '',
        ?int $branchId = null,
    ): MainOrderReportModel {

        return MainOrderReportModel::create([
            self::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            self::EFECTIVO_CAJA_INICIO => $initialCash,
            self::OBSERVACION => $observaciones,
            self::CREATED_AT => now(),
            self::USER_ID => $userId,
            self::BRANCH_ID => $branchId,
        ]);
    }
}
