<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaymentMethodStoreRequest;
use App\Http\Requests\PaymentMethodUpdateRequest;
use App\Models\PaymentMethodModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class PaymentMethodController extends Controller
{
    public function index(): JsonResponse
    {
        return Response::success(PaymentMethodModel::orderBy(PaymentMethodModel::NAME)->get());
    }

    public function store(PaymentMethodStoreRequest $request): JsonResponse
    {
        $method = PaymentMethodModel::create($request->validated());

        return Response::success($method);
    }

    public function update(PaymentMethodUpdateRequest $request, PaymentMethodModel $paymentMethod): JsonResponse
    {
        $paymentMethod->update($request->validated());

        return Response::success($paymentMethod->fresh());
    }

    public function delete(PaymentMethodModel $paymentMethod): JsonResponse
    {
        return Response::success($paymentMethod->delete());
    }
}
