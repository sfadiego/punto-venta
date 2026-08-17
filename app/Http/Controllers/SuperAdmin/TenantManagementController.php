<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Core\Data\IndexData;
use App\Enums\BusinessTypeEnum;
use App\Enums\RoleEnum;
use App\Enums\SubscriptionPlanEnum;
use App\Http\Controllers\Controller;
use App\Http\Middleware\TrackActivity;
use App\Http\Requests\TenantClearDemoDataRequest;
use App\Http\Requests\TenantStoreRequest;
use App\Http\Requests\TenantUpdateRequest;
use App\Models\BusinessConfigModel;
use App\Models\PersonalAccessToken;
use App\Models\SubscriptionModel;
use App\Models\TenantActivityLogModel;
use App\Models\User;
use App\Services\TenantActivityService;
use App\Services\TenantDemoDataService;
use App\Services\TenantService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class TenantManagementController extends Controller
{
    public function index(IndexData $data, TenantService $service): JsonResponse
    {
        return $service->run($data);
    }

    public function store(TenantStoreRequest $param): JsonResponse
    {
        $tenant = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => $param->slug,
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => (bool) ($param->is_demo ?? false),
            BusinessConfigModel::BUSINESS_NAME => $param->business_name,
            BusinessConfigModel::PRIMARY_COLOR => $param->primary_color,
            BusinessConfigModel::SIDEBAR_COLOR => $param->sidebar_color,
            BusinessConfigModel::FONT_COLOR => $param->font_color,
            BusinessConfigModel::LABEL_COLOR => $param->label_color,
            BusinessConfigModel::TIPO_NEGOCIO => $param->tipo_negocio ?? BusinessTypeEnum::Restaurante->value,
        ]);

        User::create([
            User::NOMBRE => $param->admin_nombre,
            User::APELLIDO_PATERNO => $param->admin_apellido,
            User::APELLIDO_MATERNO => '',
            User::EMAIL => $param->admin_email,
            User::USUARIO => $param->admin_usuario,
            User::PASSWORD => bcrypt($param->admin_password),
            User::ROL_ID => RoleEnum::ADMIN->value,
            User::ACTIVO => true,
            User::TENANT_ID => $tenant->id,
        ]);

        $initialPlan = SubscriptionPlanEnum::Monthly;
        $log = SubscriptionModel::createFromPlan(
            tenantId: $tenant->id,
            plan: $initialPlan,
            startsAt: Carbon::today(),
            amount: 0,
            notes: 'Suscripción inicial de 1 mes',
        );

        $tenant->update([
            BusinessConfigModel::SUBSCRIPTION_PLAN => $initialPlan->value,
            BusinessConfigModel::SUBSCRIPTION_EXPIRES_AT => $log->expires_at,
            BusinessConfigModel::MAX_USERS => $initialPlan->maxUsers(),
        ]);

        return Response::success($tenant);
    }

    public function show(BusinessConfigModel $tenant): JsonResponse
    {
        $activeWindow = now()->subMinutes(TrackActivity::activeWindowMinutes());

        $tenant->loadCount([
            'users',
            'activeSessions as active_users_count' => fn ($q) => $q->where(PersonalAccessToken::LAST_USED_AT, '>=', $activeWindow),
        ]);
        $tenant->last_activity_at = TenantActivityLogModel::query()
            ->where(TenantActivityLogModel::TENANT_ID, $tenant->id)
            ->max(TenantActivityLogModel::CREATED_AT);
        $tenant->features = $tenant->tipo_negocio->features();
        $tenant->effective_max_users = $tenant->effectiveMaxUsers();
        $tenant->plan_default_max_users = $tenant->subscription_plan
            ? (SubscriptionPlanEnum::tryFrom($tenant->subscription_plan)?->maxUsers() ?? null)
            : null;

        return Response::success($tenant);
    }

    public function update(BusinessConfigModel $tenant, TenantUpdateRequest $param): JsonResponse
    {
        $tenant->update([
            BusinessConfigModel::SLUG => $param->slug,
            BusinessConfigModel::IS_DEMO => (bool) $param->is_demo,
            BusinessConfigModel::BUSINESS_NAME => $param->business_name,
            BusinessConfigModel::PRIMARY_COLOR => $param->primary_color,
            BusinessConfigModel::SIDEBAR_COLOR => $param->sidebar_color,
            BusinessConfigModel::FONT_COLOR => $param->font_color,
            BusinessConfigModel::LABEL_COLOR => $param->label_color,
            BusinessConfigModel::LOGO_ICON => $param->logo_icon,
            BusinessConfigModel::TIPO_NEGOCIO => $param->tipo_negocio ?? $tenant->tipo_negocio->value,
            BusinessConfigModel::PRINTER_ENABLED => (bool) $param->printer_enabled,
            BusinessConfigModel::BLUETOOTH_PRINTING_ENABLED => (bool) $param->bluetooth_printing_enabled,
            BusinessConfigModel::PURCHASES_ENABLED => (bool) $param->purchases_enabled,
            BusinessConfigModel::EMPLOYEES_ENABLED => (bool) $param->employees_enabled,
            BusinessConfigModel::STOCK_ENABLED => (bool) $param->stock_enabled,
            BusinessConfigModel::CUSTOMERS_ENABLED => (bool) $param->customers_enabled,
            BusinessConfigModel::MAX_USERS => $param->max_users !== null ? (int) $param->max_users : $tenant->max_users,
            BusinessConfigModel::SUBSCRIPTION_AMOUNT => $param->has('subscription_amount') ? $param->subscription_amount : $tenant->subscription_amount,
        ]);

        return Response::success($tenant);
    }

    public function toggle(BusinessConfigModel $tenant): JsonResponse
    {
        $tenant->update([BusinessConfigModel::ACTIVO => ! $tenant->activo]);

        return Response::success($tenant);
    }

    public function restore(int $tenant): JsonResponse
    {
        $model = BusinessConfigModel::onlyTrashed()->findOrFail($tenant);
        $model->restore();

        return Response::success($model);
    }

    public function clearDemoData(BusinessConfigModel $tenant, TenantClearDemoDataRequest $param, TenantDemoDataService $service): JsonResponse
    {
        $service->clear($tenant->id, (bool) $param->boolean('deep_clean'));

        return Response::success(true);
    }

    public function delete(BusinessConfigModel $tenant): JsonResponse
    {
        return Response::success($tenant->delete());
    }

    public function activity(BusinessConfigModel $tenant, Request $request, TenantActivityService $service): JsonResponse
    {
        $days = (int) ($request->query('days') ?? 30);

        return Response::success($service->report($tenant->id, $days));
    }
}
