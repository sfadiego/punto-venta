<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Enums\LayawayPaymentTypeEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\StockMovementReasonEnum;
use App\Models\BusinessConfigModel;
use App\Models\CustomerModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderLayawayPaymentModel;
use App\Models\OrderModel;
use App\Models\StockMovementModel;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class OrderService extends DataTable
{
    public function __construct(OrderModel $model)
    {
        parent::__construct($model);
    }

    public function tableHeaders(): array
    {
        return [
            'id' => '#',
            'nombre_pedido' => 'Nombre',
            'estatus_pedido_id' => 'Estatus',
            'payment_method' => 'Pago',
            'subtotal' => 'Subtotal',
            'total' => 'Total',
            'created_at' => 'Fecha',
            'actions' => '#',
        ];
    }

    public function makeQuery(): Builder
    {
        $query = $this->model->newQuery()
            ->with(['status', 'paymentMethod:id,name', 'customer:id,name,phone'])
            // Indicador "con devolución" para el listado (Orders/Sales) — no es una columna
            // propia de la orden, se calcula al vuelo contra stock_movements vía la línea de
            // producto, así nunca se desincroniza con el histórico real de devoluciones.
            ->withExists([
                'orderProducts as has_return' => function (Builder $q) {
                    $q->whereHas('stockMovements', function (Builder $sq) {
                        $sq->where(StockMovementModel::REASON, StockMovementReasonEnum::Return);
                    });
                },
            ]);
        // Los apartados son exclusivos de retail: en cualquier otro tipo de negocio no se mezclan
        // apartados ni canceladas en la búsqueda, ni se atiende `layaways_only`.
        $isRetail = BusinessConfigModel::find(app('tenant_id'))?->tipo_negocio?->features()['is_retail'] ?? false;

        // Tab de apartados cancelados (Pedidos): solo órdenes que pasaron por un apartado, con lo
        // abonado, lo reembolsado y lo retenido de cada una. Las sumas solo se piden aquí.
        if ($isRetail && request()->boolean('layaways_only')) {
            $query->whereHas('layawayPayments')
                ->withSum(['layawayPayments as layaway_deposited' => fn (Builder $q) => $q->where(OrderLayawayPaymentModel::TYPE, LayawayPaymentTypeEnum::Deposit)], OrderLayawayPaymentModel::AMOUNT)
                ->withSum(['layawayPayments as layaway_refunded' => fn (Builder $q) => $q->where(OrderLayawayPaymentModel::TYPE, LayawayPaymentTypeEnum::Refund)], OrderLayawayPaymentModel::AMOUNT)
                ->withSum(['layawayPayments as layaway_retained' => fn (Builder $q) => $q->where(OrderLayawayPaymentModel::TYPE, LayawayPaymentTypeEnum::Forfeit)], OrderLayawayPaymentModel::AMOUNT);
        }

        $rawEstatus = request()->query('estatus_pedido_id');
        $sistemaId = request()->query('sistema_id');
        $search = request()->query('search');
        $branchId = request()->query('branch_id');

        if ($search) {
            // El buscador de la sesión actual ignora el filtro de estatus activo y busca
            // tanto en órdenes activas como cerradas — el usuario decide el alcance con el
            // texto, no con los botones de filtro.
            // Excepciones: el tab de Apartados (estatus = solo Apartado) busca únicamente entre
            // apartados, y una vista que lo pide con `strict_status` (Ventas: solo órdenes
            // cerradas) respeta su filtro de estatus — de lo contrario buscar ahí traería órdenes
            // que no son ventas.
            $estatusIds = $rawEstatus !== null ? array_map('intval', explode(',', $rawEstatus)) : [];
            $respectsStatus = $estatusIds !== [] && (
                $estatusIds === [OrderStatusEnum::LAYAWAY->value] || request()->boolean('strict_status')
            );

            // Sin esa excepción la búsqueda abarca las órdenes activas y cerradas — y, en retail, también
            // las apartadas y canceladas: un folio se debe encontrar sin importar el filtro activo.
            $searchStatuses = [OrderStatusEnum::IN_PROCESS->value, OrderStatusEnum::SERVED->value, OrderStatusEnum::CLOSED->value];
            if ($isRetail) {
                $searchStatuses = [...$searchStatuses, OrderStatusEnum::LAYAWAY->value, OrderStatusEnum::CANCELED->value];
            }

            $query->whereIn(OrderModel::ESTATUS_PEDIDO_ID, $respectsStatus ? $estatusIds : $searchStatuses)->where(function (Builder $q) use ($search) {
                $q->where(OrderModel::NOMBRE_PEDIDO, 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhereHas('customer', function (Builder $c) use ($search) {
                        $c->where(CustomerModel::NAME, 'like', "%{$search}%")
                            ->orWhere(CustomerModel::PHONE, 'like', "%{$search}%");
                    });
            });
        } elseif ($rawEstatus !== null) {
            $estatusIds = array_map('intval', explode(',', $rawEstatus));
            $query->whereIn('estatus_pedido_id', $estatusIds);
        } else {
            $query->whereIn('estatus_pedido_id', [
                OrderStatusEnum::IN_PROCESS->value,
                OrderStatusEnum::SERVED->value,
            ]);

            if (! $sistemaId) {
                // branch_id opcional: sin él, resuelve la caja activa global del tenant
                // (comportamiento sin cambios para tenants sin sucursales). Con él, resuelve
                // la caja activa de esa sucursal específica.
                $activeSale = (new MainOrderReportModel)->getActiveSale($branchId ? (int) $branchId : null);
                $sistemaId = $activeSale ? $activeSale->id : 0;
            }
        }

        if ($sistemaId) {
            $query->where('sistema_id', (int) $sistemaId);
        }

        // branch_id también aplica fuera del flujo de caja activa (búsqueda, historial de
        // Ventas con estatus explícito) — una orden no tiene branch_id propio, se resuelve
        // vía la caja (sistema) a la que pertenece. Redundante pero inofensivo cuando ya se
        // resolvió sistemaId arriba con el mismo branchId.
        if ($branchId) {
            $query->whereHas('sistema', fn (Builder $q) => $q->where(MainOrderReportModel::BRANCH_ID, (int) $branchId));
        }

        $fecha = request()->query('fecha');
        $semana = request()->query('semana');
        $mes = request()->query('mes');
        if ($fecha) {
            $query->whereDate('created_at', $fecha);
        } elseif ($semana) {
            $query->whereBetween('created_at', [
                Carbon::parse($semana)->startOfDay(),
                Carbon::parse($semana)->addDays(6)->endOfDay(),
            ]);
        } elseif ($mes) {
            [$year, $month] = explode('-', $mes);
            $query->whereYear('created_at', (int) $year)->whereMonth('created_at', (int) $month);
        }

        $categoriaId = request()->query('categoria_id');
        if ($categoriaId) {
            $query->whereHas('orderProducts.product', fn ($q) => $q->where('categoria_id', (int) $categoriaId));
        }

        return $query;
    }

    public function run(IndexData $data): JsonResponse
    {
        return parent::build($data);
    }
}
