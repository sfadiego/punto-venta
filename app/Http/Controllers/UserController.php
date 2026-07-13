<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Http\Requests\UserUpdateRequest;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
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
