<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductVariantDeleteRequest;
use App\Http\Requests\ProductVariantStoreRequest;
use App\Http\Requests\ProductVariantUpdateRequest;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use App\Services\ProductVariantService;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class ProductVariantController extends Controller
{
    public function index(ProductModel $product): JsonResponse
    {
        return Response::success($product->variants()->get());
    }

    public function store(
        ProductModel $product,
        ProductVariantStoreRequest $params,
        ProductVariantService $service,
        StockService $stockService,
    ): JsonResponse {
        return Response::success($service->create($product, $params, $stockService));
    }

    public function update(
        ProductModel $product,
        ProductVariantModel $variant,
        ProductVariantUpdateRequest $params,
        ProductVariantService $service,
    ): JsonResponse {
        return Response::success($service->update($variant, $params));
    }

    public function delete(
        ProductModel $product,
        ProductVariantModel $variant,
        ProductVariantDeleteRequest $params,
        ProductVariantService $service,
    ): JsonResponse {
        return Response::success($service->delete($variant));
    }
}
