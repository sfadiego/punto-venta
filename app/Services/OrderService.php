<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Enums\OrderStatusEnum;
use App\Models\CustomerModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
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
        $query = $this->model->newQuery()->with(['status', 'paymentMethod:id,name', 'customer:id,name,phone']);
        $rawEstatus = request()->query('estatus_pedido_id');
        $sistemaId = request()->query('sistema_id');
        $search = request()->query('search');

        if ($search) {
            // El buscador de la sesión actual ignora el filtro de estatus activo y busca
            // tanto en órdenes activas como cerradas — el usuario decide el alcance con el
            // texto, no con los botones de filtro.
            $query->whereIn(OrderModel::ESTATUS_PEDIDO_ID, [
                OrderStatusEnum::IN_PROCESS->value,
                OrderStatusEnum::SERVED->value,
                OrderStatusEnum::CLOSED->value,
            ])->where(function (Builder $q) use ($search) {
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
                $activeSale = (new MainOrderReportModel)->getActiveSale();
                $sistemaId = $activeSale ? $activeSale->id : 0;
            }
        }

        if ($sistemaId) {
            $query->where('sistema_id', (int) $sistemaId);
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
