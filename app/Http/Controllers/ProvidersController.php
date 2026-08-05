<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Http\Requests\ProviderPurchaseStoreRequest;
use App\Http\Requests\ProviderStoreRequest;
use App\Http\Requests\ProviderUpdateRequest;
use App\Models\ProviderModel;
use App\Models\ProviderPurchaseModel;
use App\Services\ProviderPurchaseService;
use App\Services\ProviderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class ProvidersController extends Controller
{
    public function index(IndexData $data, ProviderService $service): JsonResponse
    {
        return $service->run($data);
    }

    public function list(): JsonResponse
    {
        $providers = ProviderModel::select('id', 'name', 'phone', 'contact_name')
            ->orderBy('name')
            ->get();

        return Response::success($providers);
    }

    public function store(ProviderStoreRequest $params): JsonResponse
    {
        $provider = ProviderModel::create([
            ProviderModel::NAME => $params->name,
            ProviderModel::PHONE => $params->phone,
            ProviderModel::CONTACT_NAME => $params->contact_name,
            ProviderModel::NOTES => $params->notes,
        ]);

        return Response::success($provider);
    }

    public function show(ProviderModel $provider): JsonResponse
    {
        return Response::success($provider);
    }

    public function update(ProviderModel $provider, ProviderUpdateRequest $params): JsonResponse
    {
        $provider->update([
            ProviderModel::NAME => $params->name,
            ProviderModel::PHONE => $params->phone,
            ProviderModel::CONTACT_NAME => $params->contact_name,
            ProviderModel::NOTES => $params->notes,
        ]);

        return Response::success($provider);
    }

    public function delete(ProviderModel $provider): JsonResponse
    {
        return Response::success($provider->delete());
    }

    public function purchases(Request $request, ProviderModel $provider, ProviderPurchaseService $service): JsonResponse
    {
        $purchases = $service->purchasesByProvider(
            $provider->id,
            $request->query('date'),
            $request->query('month'),
            $request->query('week'),
        );

        return Response::success($purchases);
    }

    public function storePurchase(ProviderModel $provider, ProviderPurchaseStoreRequest $params): JsonResponse
    {
        $purchase = ProviderPurchaseModel::create([
            ProviderPurchaseModel::PROVIDER_ID => $provider->id,
            ProviderPurchaseModel::AMOUNT => $params->amount,
            ProviderPurchaseModel::CREATED_BY => auth()->id(),
            ProviderPurchaseModel::NOTE => $params->note,
        ]);

        return Response::success($purchase);
    }
}
