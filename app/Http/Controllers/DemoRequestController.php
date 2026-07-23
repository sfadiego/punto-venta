<?php

namespace App\Http\Controllers;

use App\Core\Enums\Http;
use App\Http\Requests\DemoRequestStoreRequest;
use App\Models\DemoRequestModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class DemoRequestController extends Controller
{
    public function store(DemoRequestStoreRequest $request): JsonResponse
    {
        $demoRequest = DemoRequestModel::create([
            DemoRequestModel::BUSINESS_NAME => $request->business_name,
            DemoRequestModel::EMAIL => $request->email,
            DemoRequestModel::PHONE => $request->phone,
            DemoRequestModel::BUSINESS_NICHE => $request->business_niche,
        ]);

        return Response::success($demoRequest, status: Http::Created);
    }
}
