<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Enums\TenantStatusEnum;
use App\Models\BusinessConfigModel;
use App\Models\PersonalAccessToken;
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

        $query->addSelect(BusinessConfigModel::lastActivitySelects());

        if ($status === TenantStatusEnum::Active) {
            $query->where(BusinessConfigModel::ACTIVO, true)
                ->where(BusinessConfigModel::IS_DEMO, false);
        }

        if ($status === TenantStatusEnum::Inactive) {
            $query->where(BusinessConfigModel::ACTIVO, false);
        }

        // "Todos" no debe incluir tenants inactivos por defecto — solo se ven explícitamente
        // seleccionando "Inactivos". Demo sí se incluye aquí (a diferencia de "Activos", que
        // los excluye) porque el filtro de demo es independiente (ver $isDemo abajo).
        if ($status === TenantStatusEnum::All) {
            $query->where(BusinessConfigModel::ACTIVO, true);
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
            $tenant->last_activity_at = BusinessConfigModel::combineLastActivity(
                $tenant->last_login_activity_at,
                $tenant->last_session_activity_at,
            );

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
