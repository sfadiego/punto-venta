<?php

namespace App\Services;

use App\Core\Paginator\DataTable;
use App\Enums\ClientLeadStatusEnum;
use App\Models\ClientLeadModel;
use Illuminate\Database\Eloquent\Builder;

class ClientLeadService extends DataTable
{
    public function __construct(ClientLeadModel $model)
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
        $status = ClientLeadStatusEnum::tryFrom((string) request()->query('status', ''));
        $search = request()->query('search');

        $query = $this->model->newQuery();

        if ($status) {
            $query->where(ClientLeadModel::STATUS, $status->value);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where(ClientLeadModel::BUSINESS_NAME, 'like', "%{$search}%")
                    ->orWhere(ClientLeadModel::EMAIL, 'like', "%{$search}%")
                    ->orWhere(ClientLeadModel::PHONE, 'like', "%{$search}%");
            });
        }

        return $query;
    }

    protected function orderQuery(string $orderParam, string $order): Builder
    {
        return $this->queryBuilder->orderBy('created_at', 'desc');
    }
}
