<?php

namespace App\Http\Controllers;

use App\Enums\ReturnReasonEnum;
use App\Exceptions\InvalidStockReturnException;
use App\Http\Requests\OrderReturnStoreRequest;
use App\Models\OrderModel;
use App\Services\OrderReturnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class OrderReturnController extends Controller
{
    public function __construct(private readonly OrderReturnService $service) {}

    /**
     * store — devolución de una o varias líneas de una orden ya cerrada (módulo de Inventario,
     * exclusivo de negocios retail — ver RetailStockMiddleware). Se aplica completa o no se aplica.
     * No modifica la orden ni su total — el histórico de venta queda intacto.
     */
    public function store(OrderModel $order, OrderReturnStoreRequest $request): JsonResponse
    {
        $order->load('sistema');
        if (! $order->isAccessibleByUser(auth()->user())) {
            return Response::unauthorized();
        }

        try {
            $return = $this->service->create(
                order: $order,
                items: $request->validated('items'),
                reason: ReturnReasonEnum::from($request->validated('reason')),
                note: $request->validated('note'),
                createdBy: auth()->id(),
                refund: $request->refunds(),
                refundPaymentMethodId: $request->validated('refund_payment_method_id'),
            );
        } catch (InvalidStockReturnException $e) {
            return Response::error($e->getMessage());
        }

        return Response::success($return);
    }
}
