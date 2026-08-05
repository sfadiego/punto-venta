<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Models\ProviderModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class ProviderService extends DataTable
{
    public function __construct(ProviderModel $model)
    {
        parent::__construct($model);
    }

    public function tableHeaders(): array
    {
        return [
            'id' => '#',
            'name' => 'Nombre',
            'phone' => 'Teléfono',
            'contact_name' => 'Contacto',
        ];
    }

    public function makeQuery(): Builder
    {
        $query = $this->model->newQuery();

        $search = request()->query('search');
        if ($search) {
            $query->where(function (Builder $q) use ($search) {
                $q->where(ProviderModel::NAME, 'like', "%{$search}%")
                    ->orWhere(ProviderModel::PHONE, 'like', "%{$search}%");
            });
        }

        $active = request()->query('active');
        if ($active !== null && $active !== '') {
            $query->where(ProviderModel::ACTIVE, filter_var($active, FILTER_VALIDATE_BOOLEAN));
        }

        return $query;
    }

    public function run(IndexData $data): JsonResponse
    {
        return parent::build($data);
    }
}
