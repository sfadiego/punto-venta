<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Enums\RoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\TenantUserSeedRequest;
use App\Http\Requests\TenantUserStoreRequest;
use App\Http\Requests\TenantUserSyncBranchesRequest;
use App\Http\Requests\TenantUserUpdateRequest;
use App\Models\BranchModel;
use App\Models\BusinessConfigModel;
use App\Models\User;
use App\Services\LoginRateLimitService;
use App\Services\RolePermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Response;

class TenantUserController extends Controller
{
    public function __construct(private readonly RolePermissionService $rolePermissionService) {}

    public function index(BusinessConfigModel $tenant): JsonResponse
    {
        $users = User::withoutGlobalScopes()
            ->where(User::TENANT_ID, $tenant->id)
            ->where(User::ROL_ID, '!=', RoleEnum::SUPERADMIN->value)
            ->orderBy(User::NOMBRE)
            ->get();

        return Response::success($users);
    }

    public function store(BusinessConfigModel $tenant, TenantUserStoreRequest $param): JsonResponse
    {
        $user = User::create([
            User::NOMBRE => $param->nombre,
            User::APELLIDO_PATERNO => $param->apellido_paterno,
            User::APELLIDO_MATERNO => $param->apellido_materno ?? '',
            User::EMAIL => $param->email,
            User::USUARIO => $param->usuario,
            User::PASSWORD => bcrypt($param->password),
            User::ROL_ID => $param->rol_id,
            User::ACTIVO => $param->activo ?? true,
            User::TENANT_ID => $tenant->id,
        ]);

        // Admin siempre tiene acceso a todas las sucursales sin necesidad de fila en
        // user_branch (ver User::authorizedBranchIds()) — cualquier branch_ids recibido
        // para un Admin se ignora en vez de crear asignaciones inútiles.
        if ($param->rol_id !== RoleEnum::ADMIN->value && $param->filled('branch_ids')) {
            $pivotData = collect($param->branch_ids)
                ->mapWithKeys(fn ($branchId) => [$branchId => [BranchModel::TENANT_ID => $tenant->id]]);

            $user->branches()->sync($pivotData);
        }

        return Response::success($user);
    }

    public function update(BusinessConfigModel $tenant, int $user, TenantUserUpdateRequest $param): JsonResponse
    {
        $model = User::withoutGlobalScopes()
            ->where(User::TENANT_ID, $tenant->id)
            ->findOrFail($user);

        $data = [
            User::NOMBRE => $param->nombre,
            User::APELLIDO_PATERNO => $param->apellido_paterno,
            User::APELLIDO_MATERNO => $param->apellido_materno ?? '',
            User::EMAIL => $param->email,
            User::USUARIO => $param->usuario,
            User::ROL_ID => $param->rol_id,
            User::ACTIVO => $param->activo ?? $model->activo,
        ];

        if ($param->filled('password')) {
            $data[User::PASSWORD] = bcrypt($param->password);
        }

        $model->update($data);

        return Response::success($model);
    }

    public function seedUsers(BusinessConfigModel $tenant, TenantUserSeedRequest $request): JsonResponse
    {
        $slug = $tenant->slug;
        $features = $tenant->tipo_negocio->features();

        // Con una sola sucursal se autoasigna sin preguntar. Con 2+, TenantUserSeedRequest
        // ya exigió branch_id explícito (el SuperAdmin lo elige en el frontend antes de
        // confirmar) — nunca se asigna "cualquiera" arbitrariamente.
        $branches = BranchModel::withoutGlobalScopes()
            ->where(BranchModel::TENANT_ID, $tenant->id)
            ->get();
        $seedBranchId = match (true) {
            $branches->count() === 1 => $branches->first()->id,
            $branches->count() > 1 => (int) $request->branch_id,
            default => null,
        };

        $seeds = [
            ['role' => RoleEnum::ADMIN,   'nombre' => 'Administrador'],
            ['role' => RoleEnum::EMPLOYE, 'nombre' => 'Empleado'],
            ['role' => RoleEnum::CAJA,    'nombre' => 'Caja'],
        ];

        if ($features['kitchen_view']) {
            $seeds[] = ['role' => RoleEnum::COCINA, 'nombre' => 'Cocina'];
        }

        $created = [];
        $skipped = [];

        foreach ($seeds as $seed) {
            $role = $seed['role'];
            $roleName = RoleEnum::getRoleName($role);
            $email = "{$roleName}@{$slug}.com";

            $exists = User::withoutGlobalScopes()
                ->where(User::TENANT_ID, $tenant->id)
                ->where(User::ROL_ID, $role->value)
                ->exists();

            if ($exists) {
                $skipped[] = $roleName;

                continue;
            }

            $user = User::create([
                User::NOMBRE => $seed['nombre'],
                User::APELLIDO_PATERNO => $slug,
                User::APELLIDO_MATERNO => '',
                User::EMAIL => $email,
                User::USUARIO => "{$roleName}-{$slug}",
                User::PASSWORD => Hash::make("{$roleName}1234"),
                User::ROL_ID => $role->value,
                User::ACTIVO => true,
                User::TENANT_ID => $tenant->id,
            ]);

            if ($seedBranchId && $role !== RoleEnum::ADMIN) {
                $user->branches()->attach($seedBranchId, [BranchModel::TENANT_ID => $tenant->id]);
            }

            $created[] = $roleName;
        }

        $this->rolePermissionService->seedDefaultsForTenant($tenant->id);

        return Response::success([
            'created' => $created,
            'skipped' => $skipped,
        ]);
    }

    public function branches(BusinessConfigModel $tenant, int $user): JsonResponse
    {
        $model = User::withoutGlobalScopes()
            ->where(User::TENANT_ID, $tenant->id)
            ->findOrFail($user);

        return Response::success([
            'is_admin' => $model->rol_id === RoleEnum::ADMIN->value,
            'branch_ids' => $model->branches()->pluck('branches.id'),
        ]);
    }

    public function syncBranches(BusinessConfigModel $tenant, int $user, TenantUserSyncBranchesRequest $params): JsonResponse
    {
        $model = User::withoutGlobalScopes()
            ->where(User::TENANT_ID, $tenant->id)
            ->findOrFail($user);

        if ($model->rol_id === RoleEnum::ADMIN->value) {
            return Response::error('Un Admin ya tiene acceso a todas las sucursales.');
        }

        $currentBranchIds = $model->branches()->pluck('branches.id')->all();
        $removedBranchIds = array_diff($currentBranchIds, $params->branch_ids);

        if ($reason = $model->blockRemovingBranchesReason($removedBranchIds)) {
            return Response::error($reason);
        }

        $pivotData = collect($params->branch_ids)
            ->mapWithKeys(fn ($branchId) => [$branchId => [BranchModel::TENANT_ID => $tenant->id]]);

        $model->branches()->sync($pivotData);

        return Response::success([
            'is_admin' => false,
            'branch_ids' => $model->branches()->pluck('branches.id'),
        ]);
    }

    public function delete(BusinessConfigModel $tenant, int $user): JsonResponse
    {
        $model = User::withoutGlobalScopes()
            ->where(User::TENANT_ID, $tenant->id)
            ->findOrFail($user);

        $model->delete();

        return Response::success(true);
    }

    public function loginLockStatus(BusinessConfigModel $tenant, int $user, LoginRateLimitService $service): JsonResponse
    {
        $model = User::withoutGlobalScopes()
            ->where(User::TENANT_ID, $tenant->id)
            ->findOrFail($user);

        $blockedIps = $service->blockedIpsFor($model->email);

        return Response::success([
            'blocked' => count($blockedIps) > 0,
            'ips' => $blockedIps,
        ]);
    }

    public function unblockLogin(BusinessConfigModel $tenant, int $user, LoginRateLimitService $service): JsonResponse
    {
        $model = User::withoutGlobalScopes()
            ->where(User::TENANT_ID, $tenant->id)
            ->findOrFail($user);

        $cleared = $service->unblock($model->email);

        return Response::success(['cleared' => $cleared]);
    }
}
