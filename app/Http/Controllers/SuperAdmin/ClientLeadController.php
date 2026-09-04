<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Core\Data\IndexData;
use App\Core\Enums\Http;
use App\Enums\ClientLeadStatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\ClientLeadStoreRequest;
use App\Http\Requests\ClientLeadUpdateRequest;
use App\Models\ClientLeadModel;
use App\Services\ClientLeadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class ClientLeadController extends Controller
{
    public function index(IndexData $data, ClientLeadService $service): JsonResponse
    {
        return $service->build($data);
    }

    public function store(ClientLeadStoreRequest $request): JsonResponse
    {
        $clientLead = ClientLeadModel::create([
            ClientLeadModel::BUSINESS_NAME => $request->business_name,
            ClientLeadModel::EMAIL => $request->email,
            ClientLeadModel::PHONE => $request->phone,
            ClientLeadModel::BUSINESS_NICHE => $request->business_niche,
            ClientLeadModel::STATUS => $request->status ?? ClientLeadStatusEnum::FollowUp->value,
            ClientLeadModel::NOTES => $request->notes,
        ]);

        return Response::success($clientLead, status: Http::Created);
    }

    public function update(ClientLeadModel $clientLead, ClientLeadUpdateRequest $request): JsonResponse
    {
        $clientLead->update([
            ClientLeadModel::STATUS => $request->status,
            ClientLeadModel::NOTES => $request->notes,
        ]);

        return Response::success($clientLead);
    }
}
