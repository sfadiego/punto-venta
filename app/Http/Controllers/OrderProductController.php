<?php

namespace App\Http\Controllers;

use App\Http\Requests\OrderProductBatchStoreRequest;
use App\Http\Requests\OrderProductStoreRequest;
use App\Http\Requests\OrderProductSyncRequest;
use App\Http\Requests\OrderProductUpdateRequest;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Services\OrderProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;

class OrderProductController extends Controller
{
    public function __construct(private readonly OrderProductService $service) {}

    /**
     * index
     */
    public function index(OrderModel $order): JsonResponse
    {
        return Response::success($this->service->lines($order));
    }

    /**
     * show
     */
    public function show(OrderModel $order, string $productId): JsonResponse
    {
        return Response::success($this->service->lines($order, $productId));
    }

    /**
     * store — agrega un producto (o extra) a la orden.
     */
    public function store(string $orderId, OrderProductStoreRequest $params): JsonResponse
    {
        $order = $this->editableOrder($orderId);
        if ($order instanceof JsonResponse) {
            return $order;
        }

        return Response::success($this->service->addProduct($order, $params));
    }

    /**
     * storeBatch — agrega varios productos de catálogo a la orden en un solo request (usado
     * por el checkout de QuickSale, un carrito completo de un tirón en vez de un POST por
     * línea — ver OrderProductService::addProducts).
     */
    public function storeBatch(string $orderId, OrderProductBatchStoreRequest $params): JsonResponse
    {
        $order = $this->editableOrder($orderId);
        if ($order instanceof JsonResponse) {
            return $order;
        }

        return Response::success($this->service->addProducts($order, $params->input('items')));
    }

    /**
     * syncProducts — deja las líneas de catálogo de la orden iguales al carrito recibido, en un
     * solo request (QuickSale retomando una venta — ver OrderProductService::syncProducts).
     */
    public function syncProducts(string $orderId, OrderProductSyncRequest $params): JsonResponse
    {
        $order = $this->editableOrder($orderId);
        if ($order instanceof JsonResponse) {
            return $order;
        }

        return Response::success($this->service->syncProducts($order, $params->input('items')));
    }

    /**
     * update — cambia cantidad o descuento de un producto de la orden.
     */
    public function update(string $orderId, string $productId, OrderProductUpdateRequest $params): JsonResponse
    {
        $orderProduct = $this->service->findLine($orderId, $productId);
        if (! $orderProduct) {
            return Response::error('La orden no contiene este producto');
        }

        $order = $this->editableOrder($orderId);
        if ($order instanceof JsonResponse) {
            return $order;
        }

        return Response::success($this->service->updateProduct($order, $orderProduct, $params));
    }

    /**
     * toggleReady — marca/desmarca un order_product como listo para servir.
     */
    public function toggleReady(int $orderId, int $item): JsonResponse
    {
        $orderProduct = $this->service->findLine($orderId, $item);
        if (! $orderProduct) {
            return Response::error('elemento no encontrado');
        }

        // lock: OrderProductService::toggleReady() decide bajo este lock si el cambio
        // completa/rompe "todos listos" y promueve/revierte el estatus de la orden — necesita
        // la fila bloqueada durante ese cálculo.
        $order = $this->editableOrder($orderId, lock: true);
        if ($order instanceof JsonResponse) {
            return $order;
        }

        return Response::success($this->service->toggleReady($order, $orderProduct));
    }

    /**
     * updateNote — actualiza la observación por id de order_product (aplica a productos y extras).
     */
    public function updateNote(int $orderId, int $item, Request $request): JsonResponse
    {
        $orderProduct = $this->service->findLine($orderId, $item);
        if (! $orderProduct) {
            return Response::error('elemento no encontrado');
        }

        // Solo acceso, no estatus: la observación se puede corregir aunque la orden ya no admita
        // cambios de productos.
        $order = $this->service->findOrder($orderId);
        if ($denied = $this->denial($order, requireEditable: false)) {
            return $denied;
        }

        return Response::success($this->service->updateNote($order, $orderProduct, $request->input('observacion')));
    }

    /**
     * deleteExtra — borra cualquier order_product por su propio id.
     */
    public function deleteExtra(int $orderId, int $extra): JsonResponse
    {
        $order = $this->editableOrder($orderId, lock: true);
        if ($order instanceof JsonResponse) {
            return $order;
        }

        $item = $this->service->findLine($orderId, $extra);
        if (! $item) {
            return Response::error('elemento no encontrado');
        }

        $this->service->removeItem($order, $item);

        return Response::success('elemento borrado de la orden');
    }

    /**
     * clearCart — borra todos los order_product (productos y extras) de la orden en un paso.
     */
    public function clearCart(int $orderId): JsonResponse
    {
        $order = $this->editableOrder($orderId, lock: true);
        if ($order instanceof JsonResponse) {
            return $order;
        }

        $this->service->clearCart($order);

        return Response::success('carrito vaciado');
    }

    /**
     * delete — borra un producto regular de la orden por producto_id.
     */
    public function delete(int $orderId, int $product): JsonResponse
    {
        $order = $this->editableOrder($orderId, lock: true);
        if ($order instanceof JsonResponse) {
            return $order;
        }

        $item = $this->service->findLine($orderId, $product, OrderProductModel::PRODUCTO_ID);
        if (! $item) {
            Log::error('producto no encontrado', [$product]);

            return Response::error('producto no encontrado');
        }

        $this->service->removeItem($order, $item);

        return Response::success('elemento borrado de la orden');
    }

    /**
     * La orden si existe, el usuario accede a ella y admite cambios de productos; si no, la
     * respuesta de error que corresponde.
     */
    private function editableOrder(int|string $orderId, bool $lock = false): OrderModel|JsonResponse
    {
        $order = $this->service->findOrder($orderId, $lock);

        return $this->denial($order) ?? $order;
    }

    /** Traduce el motivo de OrderProductService::orderDenial() a su respuesta HTTP. */
    private function denial(?OrderModel $order, bool $requireEditable = true): ?JsonResponse
    {
        $reason = $this->service->orderDenial($order, auth()->user(), $requireEditable);

        return match ($reason) {
            null => null,
            OrderProductService::DENIED_ACCESS => Response::unauthorized(),
            default => Response::error($reason),
        };
    }
}
