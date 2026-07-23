<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Core\Data\IndexData;
use App\Http\Controllers\Controller;
use App\Http\Requests\DemoRequestUpdateRequest;
use App\Models\DemoRequestModel;
use App\Services\DemoRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class DemoRequestController extends Controller
{
    public function index(IndexData $data, DemoRequestService $service): JsonResponse
    {
        return $service->build($data);
    }

    public function update(DemoRequestModel $demoRequest, DemoRequestUpdateRequest $request): JsonResponse
    {
        $demoRequest->update([
            DemoRequestModel::STATUS => $request->status,
            DemoRequestModel::NOTES => $request->notes,
        ]);

        return Response::success($demoRequest);
    }
}
