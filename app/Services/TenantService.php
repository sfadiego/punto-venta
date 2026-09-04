<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Enums\TenantStatusEnum;
use App\Models\BusinessConfigModel;
use App\Models\PersonalAccessToken;
use App\Models\TenantActivityLogModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Response;

class TenantService extends DataTable
{
    public function __construct(BusinessConfigModel $model)
    {
        parent::__construct($model);
    }

    public function tableHeaders(): array
    {
        return [
            'id' => '#',
            'slug' => 'Slug',
            'business_name' => 'Negocio',
        ];
    }

    public function makeQuery(): \Illuminate\Database\Eloquent\Builder
    {
        $status = TenantStatusEnum::tryFrom(request()->query('status', ''));
        $search = request()->query('search');

        $query = $status === TenantStatusEnum::Deleted
            ? $this->model->onlyTrashed()
            : $this->model->newQuery();

        $activeWindow = now()->subMinutes(PersonalAccessToken::activeWindowMinutes());

        $query->withCount([
            'users',
            'activeSessions as active_users_count' => fn ($q) => $q->where(PersonalAccessToken::LAST_USED_AT, '>=', $activeWindow),
        ]);

        // Dos fuentes por separado (portable entre MySQL/SQLite, sin GREATEST()): el login/venta más
        // reciente de tenant_activity_logs, y el último uso real de sesión vía Sanctum. Se combinan
        // en run() — un tenant con usuarios navegando activamente (sin volver a loguearse ni cerrar
        // una venta) no debe verse como "sin actividad" solo por el gap de cobertura de
        // ActivityTypeEnum (solo registra LOGIN y SALE_CLOSED).
        $query->addSelect([
            'last_login_activity_at' => TenantActivityLogModel::query()
                ->selectRaw('MAX('.TenantActivityLogModel::CREATED_AT.')')
                ->whereColumn(TenantActivityLogModel::TENANT_ID, $this->model->getTable().'.id'),
            'last_session_activity_at' => PersonalAccessToken::query()
                ->selectRaw('MAX('.PersonalAccessToken::LAST_USED_AT.')')
                ->whereColumn(PersonalAccessToken::TENANT_ID, $this->model->getTable().'.id'),
        ]);

        if ($status === TenantStatusEnum::Active) {
            $query->where(BusinessConfigModel::ACTIVO, true)
                ->where(BusinessConfigModel::IS_DEMO, false);
        }

        if ($status === TenantStatusEnum::Inactive) {
            $query->where(BusinessConfigModel::ACTIVO, false);
        }

        $isDemo = request()->query('is_demo');
        if ($isDemo !== null) {
            $query->where(BusinessConfigModel::IS_DEMO, filter_var($isDemo, FILTER_VALIDATE_BOOLEAN));
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where(BusinessConfigModel::BUSINESS_NAME, 'like', "%{$search}%")
                    ->orWhere(BusinessConfigModel::SLUG, 'like', "%{$search}%");
            });
        }

        return $query;
    }

    public function run(IndexData $data): JsonResponse
    {
        $this->queryBuilder = $this->makeQuery();
        $this->orderQuery($data->orderParam, $data->order);

        $paginator = $this->queryBuilder->paginate($data->perPage, ['*'], 'page', $data->page);

        $paginator->getCollection()->each(function ($tenant) {
            $tenant->last_activity_at = collect([
                $tenant->last_login_activity_at,
                $tenant->last_session_activity_at,
            ])->filter()->max();

            unset($tenant->last_login_activity_at, $tenant->last_session_activity_at);
        });

        return Response::successDataTable(
            new LengthAwarePaginator(
                $paginator->getCollection(),
                $paginator->total(),
                $paginator->perPage(),
                $paginator->currentPage()
            ),
            $this->tableHeaders()
        );
    }
}
