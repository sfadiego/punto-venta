<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Enums\RoleEnum;
use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserSyncBranchesRequest;
use App\Http\Requests\UserUpdateRequest;
use App\Models\BranchModel;
use App\Models\BusinessConfigModel;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Response;

class UserController extends Controller
{
    public function index(IndexData $data, UserService $service): JsonResponse
    {
        return $service->run($data);
    }

    public function show(User $user): JsonResponse
    {
        return Response::success($user);
    }

    /**
     * Sucursales asignadas explícitamente al usuario (fila en user_branch). Un Admin
     * siempre tiene acceso a todas sin necesidad de asignación — is_admin lo indica para
     * que el panel muestre "acceso a todas las sucursales" en vez de un picker vacío.
     */
    public function branches(User $user): JsonResponse
    {
        return Response::success([
            'is_admin' => $user->rol_id === RoleEnum::ADMIN->value,
            'branch_ids' => $user->branches()->pluck('branches.id'),
        ]);
    }

    /** Reemplaza el set completo de sucursales asignadas a este usuario. */
    public function syncBranches(User $user, UserSyncBranchesRequest $params): JsonResponse
    {
        if ($user->rol_id === RoleEnum::ADMIN->value) {
            return Response::error('Un Admin ya tiene acceso a todas las sucursales.');
        }

        $currentBranchIds = $user->branches()->pluck('branches.id')->all();
        $removedBranchIds = array_diff($currentBranchIds, $params->branch_ids);

        if ($reason = $user->blockRemovingBranchesReason($removedBranchIds)) {
            return Response::error($reason);
        }

        $pivotData = collect($params->branch_ids)
            ->mapWithKeys(fn ($branchId) => [$branchId => [BranchModel::TENANT_ID => $user->tenant_id]]);

        $user->branches()->sync($pivotData);

        return Response::success([
            'is_admin' => false,
            'branch_ids' => $user->branches()->pluck('branches.id'),
        ]);
    }

    public function store(UserStoreRequest $request): JsonResponse
    {
        $tenant = BusinessConfigModel::find(app('tenant_id'));
        $currentUsers = User::where(User::TENANT_ID, app('tenant_id'))->count();

        if ($currentUsers >= $tenant->effectiveMaxUsers()) {
            return Response::error(__('Alcanzaste el límite de usuarios de tu plan de suscripción.'));
        }

        $user = User::create([
            User::NOMBRE => $request->nombre,
            User::APELLIDO_PATERNO => $request->apellido_paterno,
            User::APELLIDO_MATERNO => $request->apellido_materno ?? '',
            User::EMAIL => $request->email,
            User::USUARIO => $request->usuario,
            User::PASSWORD => Hash::make($request->password),
            User::ROL_ID => $request->rol_id,
            User::ACTIVO => $request->activo ?? true,
        ]);

        return Response::success($user);
    }

    public function update(UserUpdateRequest $request, User $user): JsonResponse
    {
        $data = collect($request->validated())->except('password')->toArray();

        if (filled($request->password)) {
            $data[User::PASSWORD] = bcrypt($request->password);
        }

        $user->update($data);

        return Response::success($user->fresh());
    }
}
