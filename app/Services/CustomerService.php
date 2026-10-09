<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Models\CustomerModel;
use App\Models\OrderModel;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class CustomerService extends DataTable
{
    public function __construct(CustomerModel $model)
    {
        parent::__construct($model);
    }

    public function tableHeaders(): array
    {
        return [
            'id' => '#',
            'name' => 'Nombre',
            'phone' => 'Teléfono',
            'balance' => 'Adeudo',
            'allow_credit' => 'Crédito habilitado',
        ];
    }

    public function makeQuery(): Builder
    {
        // Apartados activos por cliente para la columna "Apartados" del listado — el saldo pendiente
        // es layaway_total - layaway_paid.
        $query = $this->model->newQuery()->withLayawaySummary();

        $search = request()->query('search');
        if ($search) {
            $query->where(function (Builder $q) use ($search) {
                $q->where(CustomerModel::NAME, 'like', "%{$search}%")
                    ->orWhere(CustomerModel::PHONE, 'like', "%{$search}%");
            });
        }

        if (request()->query('with_debt') === '1') {
            $query->where(CustomerModel::BALANCE, '>', 0);
        }

        // Clientes con apartados activos, y de ellos los que tienen alguno vencido (fecha límite
        // anterior a hoy). Ambos filtros se combinan con los demás (AND).
        if (request()->query('with_layaway') === '1') {
            $query->whereHas('activeLayaways');
        }

        if (request()->query('layaway_overdue') === '1') {
            $query->whereHas('activeLayaways', fn (Builder $q) => $q->where(OrderModel::LAYAWAY_DUE_DATE, '<', Carbon::today()->toDateString()));
        }

        return $query;
    }

    public function run(IndexData $data): JsonResponse
    {
        return parent::build($data);
    }
}
