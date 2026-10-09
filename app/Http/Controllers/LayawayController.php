<?php

namespace App\Http\Controllers;

use App\Exceptions\InsufficientStockException;
use App\Exceptions\InvalidLayawayException;
use App\Http\Requests\LayawayCancelRequest;
use App\Http\Requests\LayawayPaymentStoreRequest;
use App\Http\Requests\LayawayStoreRequest;
use App\Models\OrderModel;
use App\Services\LayawayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class LayawayController extends Controller
{
    public function __construct(private readonly LayawayService $service) {}

    public function summary(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id') ? (int) $request->query('branch_id') : null;

        if ($branchId && ! auth()->user()->canAccessBranch($branchId)) {
            return Response::unauthorized();
        }

        return Response::success($this->service->summary($branchId));
    }

    public function show(OrderModel $order): JsonResponse
    {
        if (! $order->loadMissing('sistema')->isAccessibleByUser(auth()->user())) {
            return Response::unauthorized();
        }

        return Response::success($order->load(['layawayPayments.paymentMethod:id,name', 'customer:id,name,phone', 'paymentMethod:id,name']));
    }

    public function store(OrderModel $order, LayawayStoreRequest $params): JsonResponse
    {
        if (! $order->loadMissing('sistema')->isAccessibleByUser(auth()->user())) {
            return Response::unauthorized();
        }

        try {
            $layaway = $this->service->create(
                $order,
                (int) $params->customer_id,
                (float) $params->amount,
                (int) $params->payment_method_id,
                (int) $params->sistema_id,
                $params->due_date,
                $params->note,
            );
        } catch (InvalidLayawayException|InsufficientStockException $e) {
            return Response::error($e->getMessage());
        }

        return Response::success($layaway);
    }

    public function payment(OrderModel $order, LayawayPaymentStoreRequest $params): JsonResponse
    {
        if (! $order->loadMissing('sistema')->isAccessibleByUser(auth()->user())) {
            return Response::unauthorized();
        }

        try {
            $layaway = $this->service->addPayment(
                $order,
                (float) $params->amount,
                (int) $params->payment_method_id,
                (int) $params->sistema_id,
                $params->note,
            );
        } catch (InvalidLayawayException $e) {
            return Response::error($e->getMessage());
        }

        return Response::success($layaway);
    }

    public function cancel(OrderModel $order, LayawayCancelRequest $params): JsonResponse
    {
        if (! $order->loadMissing('sistema')->isAccessibleByUser(auth()->user())) {
            return Response::unauthorized();
        }

        try {
            $layaway = $this->service->cancel(
                $order,
                (int) $params->sistema_id,
                $params->filled('payment_method_id') ? (int) $params->payment_method_id : null,
                $params->note,
                $params->filled('retained_amount') ? (float) $params->retained_amount : null,
            );
        } catch (InvalidLayawayException $e) {
            return Response::error($e->getMessage());
        }

        return Response::success($layaway);
    }
}
