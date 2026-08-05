<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Models\EmployeeModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class EmployeeService extends DataTable
{
    public function __construct(EmployeeModel $model)
    {
        parent::__construct($model);
    }

    public function tableHeaders(): array
    {
        return [
            'id' => '#',
            'name' => 'Nombre',
            'phone' => 'Teléfono',
            'salary' => 'Salario',
            'salary_period' => 'Periodicidad',
            'work_days' => 'Días',
        ];
    }

    public function makeQuery(): Builder
    {
        $query = $this->model->newQuery();

        $search = request()->query('search');
        if ($search) {
            $query->where(function (Builder $q) use ($search) {
                $q->where(EmployeeModel::NAME, 'like', "%{$search}%")
                    ->orWhere(EmployeeModel::PHONE, 'like', "%{$search}%");
            });
        }

        $active = request()->query('active');
        if ($active !== null && $active !== '') {
            $query->where(EmployeeModel::ACTIVE, filter_var($active, FILTER_VALIDATE_BOOLEAN));
        }

        return $query;
    }

    public function run(IndexData $data): JsonResponse
    {
        return parent::build($data);
    }
}
