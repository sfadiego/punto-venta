<?php

namespace App\Models;

use App\Enums\OrderStatusEnum;
use App\Models\Traits\HasTenant;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerModel extends Model
{
    use HasFactory, HasTenant, SoftDeletes;

    protected $table = 'customers';

    const NAME = 'name';

    const PHONE = 'phone';

    const NOTES = 'notes';

    const ADDRESS = 'address';

    const DELIVERY_REFERENCE = 'delivery_reference';

    const ALLOW_CREDIT = 'allow_credit';

    const BALANCE = 'balance';

    const TENANT_ID = 'tenant_id';

    protected $fillable = [
        self::NAME,
        self::PHONE,
        self::NOTES,
        self::ADDRESS,
        self::DELIVERY_REFERENCE,
        self::ALLOW_CREDIT,
        self::BALANCE,
        self::TENANT_ID,
    ];

    protected $casts = [
        self::ALLOW_CREDIT => 'boolean',
        self::BALANCE => 'decimal:2',
    ];

    public function creditOrders(): HasMany
    {
        return $this->hasMany(OrderModel::class, 'customer_id')
            ->where('is_credit', true)
            ->orderByDesc('created_at');
    }

    /** Apartados activos del cliente (aún sin liquidar ni cancelar). */
    public function activeLayaways(): HasMany
    {
        return $this->hasMany(OrderModel::class, 'customer_id')
            ->where(OrderModel::ESTATUS_PEDIDO_ID, OrderStatusEnum::LAYAWAY->value);
    }

    /**
     * Agrega por cliente sus apartados activos: cantidad, total, abonado y cuántos ya vencieron
     * (layaway_count, layaway_total, layaway_paid, layaway_overdue_count). Indicador aparte del
     * adeudo: un apartado no suma a customers.balance.
     */
    public function scopeWithLayawaySummary(Builder $query): Builder
    {
        return $query
            ->withCount('activeLayaways as layaway_count')
            ->withSum('activeLayaways as layaway_total', OrderModel::TOTAL)
            ->withSum('activeLayaways as layaway_paid', OrderModel::AMOUNT_PAID)
            ->withCount(['activeLayaways as layaway_overdue_count' => fn (Builder $q) => $q->where(OrderModel::LAYAWAY_DUE_DATE, '<', Carbon::today()->toDateString())]);
    }

    /** Órdenes que tienen o tuvieron abonos de apartado (activas, liquidadas o canceladas). */
    public function layawayOrders(): HasMany
    {
        return $this->hasMany(OrderModel::class, 'customer_id')
            ->whereHas('layawayPayments')
            ->with('layawayPayments')
            ->orderByDesc('created_at');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(CustomerPaymentModel::class, 'customer_id')
            ->orderByDesc('created_at');
    }

    /**
     * Devoluciones de sus ventas a crédito que bajaron su saldo (parte del reembolso aplicada al
     * adeudo), la más reciente primero. No son abonos: no pasan por customer_payments (de ahí sale
     * "último abono" de Estadísticas), así que el historial las muestra aparte.
     */
    public function balanceReturns(): HasManyThrough
    {
        return $this->hasManyThrough(OrderReturnModel::class, OrderModel::class, 'customer_id', 'order_id')
            ->where('order_returns.'.OrderReturnModel::BALANCE_APPLIED, '>', 0)
            ->orderByDesc('order_returns.created_at');
    }

    public function charges(): HasMany
    {
        return $this->hasMany(CustomerChargeModel::class, 'customer_id')
            ->orderByDesc('created_at');
    }
}
