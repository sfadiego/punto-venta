<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Enums\TenantStatusEnum;
use App\Http\Middleware\TrackActivity;
use App\Models\BusinessConfigModel;
use App\Models\PersonalAccessToken;
use App\Models\TenantActivityLogModel;
use Illuminate\Http\JsonResponse;

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

        $activeWindow = now()->subMinutes(TrackActivity::activeWindowMinutes());

        $query->withCount([
            'users',
            'activeSessions as active_users_count' => fn ($q) => $q->where(PersonalAccessToken::LAST_USED_AT, '>=', $activeWindow),
        ]);

        $query->addSelect([
            'last_activity_at' => TenantActivityLogModel::query()
                ->selectRaw('MAX('.TenantActivityLogModel::CREATED_AT.')')
                ->whereColumn(TenantActivityLogModel::TENANT_ID, $this->model->getTable().'.id'),
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
        return parent::build($data);
    }
}
