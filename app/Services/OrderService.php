<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Enums\OrderStatusEnum;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
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
        $query = $this->model->newQuery()->with(['status', 'paymentMethod:id,name']);
        $rawEstatus = request()->query('estatus_pedido_id');
        $sistemaId = request()->query('sistema_id');

        if ($rawEstatus !== null) {
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
        if ($fecha) {
            $query->whereDate('created_at', $fecha);
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
