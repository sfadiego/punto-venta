<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Models\CustomerModel;
use App\Models\OrderModel;
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
        // Apartados activos por cliente (cantidad, total y abonado) para la columna "Apartados" del
        // listado — el saldo pendiente es layaway_total - layaway_paid. Es un indicador aparte del
        // adeudo: un apartado no suma a customers.balance.
        $query = $this->model->newQuery()
            ->withCount('activeLayaways as layaway_count')
            ->withSum('activeLayaways as layaway_total', OrderModel::TOTAL)
            ->withSum('activeLayaways as layaway_paid', OrderModel::AMOUNT_PAID);

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

        return $query;
    }

    public function run(IndexData $data): JsonResponse
    {
        return parent::build($data);
    }
}
