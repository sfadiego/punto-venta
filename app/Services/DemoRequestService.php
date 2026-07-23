<?php

namespace App\Services;

use App\Core\Paginator\DataTable;
use App\Enums\DemoRequestStatusEnum;
use App\Models\DemoRequestModel;
use Illuminate\Database\Eloquent\Builder;

class DemoRequestService extends DataTable
{
    public function __construct(DemoRequestModel $model)
    {
        parent::__construct($model);
    }

    public function tableHeaders(): array
    {
        return [
            'id' => '#',
            'business_name' => 'Negocio',
            'email' => 'Email',
            'phone' => 'Teléfono',
            'business_niche' => 'Giro',
            'status' => 'Estatus',
            'created_at' => 'Fecha',
        ];
    }

    public function makeQuery(): Builder
    {
        $status = DemoRequestStatusEnum::tryFrom((string) request()->query('status', ''));
        $search = request()->query('search');

        $query = $this->model->newQuery();

        if ($status) {
            $query->where(DemoRequestModel::STATUS, $status->value);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where(DemoRequestModel::BUSINESS_NAME, 'like', "%{$search}%")
                    ->orWhere(DemoRequestModel::EMAIL, 'like', "%{$search}%")
                    ->orWhere(DemoRequestModel::PHONE, 'like', "%{$search}%");
            });
        }

        return $query;
    }

    protected function orderQuery(string $orderParam, string $order): Builder
    {
        return $this->queryBuilder->orderBy('created_at', 'desc');
    }
}
