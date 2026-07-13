<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Core\Data\IndexData;
use App\Enums\BusinessTypeEnum;
use App\Enums\RoleEnum;
use App\Enums\SubscriptionPlanEnum;
use App\Http\Controllers\Controller;
use App\Http\Middleware\TrackActivity;
use App\Http\Requests\TenantStoreRequest;
use App\Http\Requests\TenantUpdateRequest;
use App\Models\BusinessConfigModel;
use App\Models\SubscriptionModel;
use App\Models\User;
use App\Services\TenantService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
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
        ]);

        return Response::success($tenant);
    }

    public function show(BusinessConfigModel $tenant): JsonResponse
    {
        $activeWindow = now()->subMinutes(TrackActivity::activeWindowMinutes());

        $tenant->loadCount([
            'users',
            'users as active_users_count' => fn ($q) => $q->where('last_seen_at', '>=', $activeWindow),
        ]);
        $tenant->features = $tenant->tipo_negocio->features();

        return Response::success($tenant);
    }

    public function update(BusinessConfigModel $tenant, TenantUpdateRequest $param): JsonResponse
    {
        $tenant->update([
            BusinessConfigModel::SLUG => $param->slug,
            BusinessConfigModel::BUSINESS_NAME => $param->business_name,
            BusinessConfigModel::PRIMARY_COLOR => $param->primary_color,
            BusinessConfigModel::SIDEBAR_COLOR => $param->sidebar_color,
            BusinessConfigModel::FONT_COLOR => $param->font_color,
            BusinessConfigModel::LABEL_COLOR => $param->label_color,
            BusinessConfigModel::LOGO_ICON => $param->logo_icon,
            BusinessConfigModel::TIPO_NEGOCIO => $param->tipo_negocio ?? $tenant->tipo_negocio->value,
            BusinessConfigModel::PRINTER_ENABLED => (bool) $param->printer_enabled,
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

    public function clearDemoData(BusinessConfigModel $tenant): JsonResponse
    {
        $tenantId = $tenant->id;

        $orderIds = DB::table('order')
            ->where('tenant_id', $tenantId)
            ->pluck('id');

        if ($orderIds->isNotEmpty()) {
            DB::table('order_product')->whereIn('pedido_id', $orderIds)->delete();
            DB::table('order')->where('tenant_id', $tenantId)->delete();
        }

        DB::table('main_order_report')->where('tenant_id', $tenantId)->delete();

        return Response::success(true);
    }

    public function delete(BusinessConfigModel $tenant): JsonResponse
    {
        return Response::success($tenant->delete());
    }
}
