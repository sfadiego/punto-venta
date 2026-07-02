<?php

namespace App\Models;

use App\Enums\MainOrderStatusEnum;
use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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

    protected $fillable = [
        self::ESTATUS_CAJA,
        self::EFECTIVO_CAJA_INICIO,
        self::EFECTIVO_CAJA_CIERRE,
        self::VENTA_DIA,
        self::OBSERVACION,
        self::USER_ID,
        self::TENANT_ID,
    ];

    public function orders()
    {
        return $this->hasMany(OrderModel::class, 'sistema_id');
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

    public function totalSalesByDay(): float
    {
        return $this->where('id', $this->id)
            ->whereHas('orders.orderProducts')
            ->with(['orders' => function ($q) {
                $q->where('estatus_pedido_id', \App\Enums\OrderStatusEnum::CLOSED->value);
            }, 'orders.orderProducts'])
            ->get()
            ->pluck('orders')
            ->flatten()
            ->pluck('orderProducts')
            ->flatten()
            ->map(function ($item) {
                $total = $item->precio * $item->cantidad;
                $totalWDescuento = $total - (($total * $item->descuento) / 100);

                return round($totalWDescuento, 2);
            })
            ->sum();
    }

    public function totalDomiciliosByDay(): float
    {
        return round(
            OrderModel::where('sistema_id', $this->id)
                ->where('estatus_pedido_id', \App\Enums\OrderStatusEnum::CLOSED->value)
                ->sum('costo_domicilio'),
            2
        );
    }

    public function closeSales(): MainOrderReportModel
    {
        $initialCash = $this->efectivo_caja_inicio;
        $totalBruto = $this->totalSalesByDay();
        $totalDomicilio = $this->totalDomiciliosByDay();

        $this->update([
            self::VENTA_DIA => $totalBruto,
            self::EFECTIVO_CAJA_CIERRE => $initialCash + $totalBruto - $totalDomicilio,
            self::ESTATUS_CAJA => MainOrderStatusEnum::CLOSED,
        ]);

        return $this->refresh();
    }

    public static function validateIfOpenSaleActive(): bool
    {
        return MainOrderReportModel::where(self::ESTATUS_CAJA, MainOrderStatusEnum::OPEN)
            ->exists();
    }

    public function getActiveSale(): ?MainOrderReportModel
    {
        $order = MainOrderReportModel::with('user')
            ->where(self::ESTATUS_CAJA, MainOrderStatusEnum::OPEN);

        return $order->exists() ? $order->first() : null;
    }

    public static function openSales(
        float $initialCash,
        int $userId,
        string $observaciones = ''
    ): MainOrderReportModel {

        return MainOrderReportModel::create([
            self::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            self::EFECTIVO_CAJA_INICIO => $initialCash,
            self::OBSERVACION => $observaciones,
            self::CREATED_AT => now(),
            self::USER_ID => $userId,
        ]);
    }
}
