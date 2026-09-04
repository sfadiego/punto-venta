<?php

namespace App\Http\Controllers;

use App\Core\Enums\Http;
use App\Http\Requests\DemoRequestStoreRequest;
use App\Models\ClientLeadModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class DemoRequestController extends Controller
{
    public function store(DemoRequestStoreRequest $request): JsonResponse
    {
        $clientLead = ClientLeadModel::create([
            ClientLeadModel::BUSINESS_NAME => $request->business_name,
            ClientLeadModel::EMAIL => $request->email,
            ClientLeadModel::PHONE => $request->phone,
            ClientLeadModel::BUSINESS_NICHE => $request->business_niche,
        ]);

        return Response::success($clientLead->fresh(), status: Http::Created);
    }
}
