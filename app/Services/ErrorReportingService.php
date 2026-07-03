<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Models\ErrorReporting;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class ErrorReportingService extends DataTable
{
    private ?string $source = null;

    public function __construct(ErrorReporting $model)
    {
        parent::__construct($model);
    }

    public function tableHeaders(): array
    {
        return [
            'id' => '#',
            'source' => '',
            'endpoint' => '',
            'method' => '',
            'status_code' => '',
            'error_message' => '',
            'request_payload' => '',
            'response_body' => '',
            'user_agent' => '',
            'url' => '',
            'created_at' => '#',
        ];
    }

    public function makeQuery(): Builder
    {
        $query = $this->model->newQuery();

        if (! empty($this->source)) {
            $query->where('source', $this->source);
        }

        return $query;
    }

    protected function orderQuery(string $orderParam, string $order): Builder
    {
        return $this->queryBuilder->orderBy('created_at', 'desc');
    }

    public function run(IndexData $data, ?string $source = null): JsonResponse
    {
        $this->source = $source;

        return parent::build($data);
    }
}
