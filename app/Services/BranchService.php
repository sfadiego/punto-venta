<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Models\BranchModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class BranchService extends DataTable
{
    public function __construct(BranchModel $model)
    {
        parent::__construct($model);
    }

    public function tableHeaders(): array
    {
        return [
            'id' => '#',
            'name' => 'Nombre',
            'address' => 'Dirección',
            'phone' => 'Teléfono',
            'active' => 'Activa',
        ];
    }

    public function makeQuery(): Builder
    {
        $query = $this->model->newQuery();

        $search = request()->query('search');
        if ($search) {
            $query->where(BranchModel::NAME, 'like', "%{$search}%");
        }

        return $query;
    }

    public function run(IndexData $data): JsonResponse
    {
        return parent::build($data);
    }
}
