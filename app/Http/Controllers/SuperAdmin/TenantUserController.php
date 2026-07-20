<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Enums\RoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\TenantUserStoreRequest;
use App\Http\Requests\TenantUserUpdateRequest;
use App\Models\BusinessConfigModel;
use App\Models\User;
use App\Services\LoginRateLimitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Response;

class TenantUserController extends Controller
{
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

    public function seedUsers(BusinessConfigModel $tenant): JsonResponse
    {
        $slug = $tenant->slug;
        $features = $tenant->tipo_negocio->features();

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

            User::create([
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

            $created[] = $roleName;
        }

        return Response::success([
            'created' => $created,
            'skipped' => $skipped,
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
