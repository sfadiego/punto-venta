<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Core\Enums\Http;
use App\Enums\OrderStatusEnum;
use App\Events\OrdersUpdated;
use App\Http\Requests\PublicOrderStoreRequest;
use App\Models\BusinessConfigModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\ProductModel;
use App\Services\MenuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response;

class MenuController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        $tenant = BusinessConfigModel::where(BusinessConfigModel::SLUG, $slug)
            ->where('activo', true)
            ->firstOrFail();

        app()->instance('tenant_id', $tenant->id);

        $hasActiveSession = (new MainOrderReportModel)->getActiveSale() !== null;

        return Response::success([
            'business_name' => $tenant->business_name,
            'primary_color' => $tenant->primary_color,
            'logo' => $tenant->logo_path,
            'costo_domicilio_default' => $tenant->costo_domicilio_default ?? 0,
            'has_active_session' => $hasActiveSession,
            'menu_enabled' => (bool) $tenant->menu_enabled,
        ]);
    }

    public function products(IndexData $data, string $slug, MenuService $service): JsonResponse
    {
        $tenant = BusinessConfigModel::where(BusinessConfigModel::SLUG, $slug)
            ->where('activo', true)
            ->firstOrFail();

        app()->instance('tenant_id', $tenant->id);

        return $service->run($data);
    }

    public function store(PublicOrderStoreRequest $request, string $slug): JsonResponse
    {
        $tenant = BusinessConfigModel::where(BusinessConfigModel::SLUG, $slug)
            ->where('activo', true)
            ->firstOrFail();

        app()->instance('tenant_id', $tenant->id);

        if (! $tenant->menu_enabled) {
            return Response::error('Los pedidos en línea no están disponibles en este momento.', null);
        }

        $activeSale = (new MainOrderReportModel)->getActiveSale();

        if (! $activeSale) {
            return Response::error(
                'El negocio no tiene una sesión activa en este momento. Intenta más tarde o comunícate directamente con nosotros.',
                null,
            );
        }

        $order = DB::transaction(function () use ($request, $tenant, $activeSale) {
            $order = OrderModel::create([
                OrderModel::TENANT_ID => $tenant->id,
                OrderModel::SISTEMA_ID => $activeSale->id,
                OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::PENDING_CONFIRMATION->value,
                OrderModel::NOMBRE_PEDIDO => $request->customer_name,
                OrderModel::CUSTOMER_PHONE => $request->customer_phone,
                OrderModel::IS_DELIVERY => $request->boolean('is_delivery'),
                OrderModel::DELIVERY_ADDRESS => $request->delivery_address,
                OrderModel::DELIVERY_REFERENCE => $request->delivery_reference,
                OrderModel::TOTAL => 0,
                OrderModel::SUBTOTAL => 0,
            ]);

            foreach ($request->items as $item) {
                $product = ProductModel::withoutGlobalScopes()
                    ->where('id', $item['product_id'])
                    ->where('tenant_id', $tenant->id)
                    ->where(ProductModel::ACTIVO, true)
                    ->firstOrFail();

                OrderProductModel::create([
                    'pedido_id' => $order->id,
                    'producto_id' => $product->id,
                    'cantidad' => $item['cantidad'],
                    'precio' => $product->precio,
                    'descuento' => 0,
                    OrderProductModel::OBSERVACION => $item['observacion'] ?? null,
                ]);
            }

            $totals = $order->totalAndSubTotalOrder();
            $order->update([
                OrderModel::TOTAL => $totals['total'],
                OrderModel::SUBTOTAL => $totals['subtotal'],
            ]);

            return $order;
        });

        try {
            broadcast(new OrdersUpdated('new_public_order'));
        } catch (\Throwable) {
            // Reverb unavailable — order must not fail
        }

        return Response::success([
            'order_id' => $order->id,
            'nombre_pedido' => $order->nombre_pedido,
            'total' => $order->total,
        ], null, Http::Created);
    }
}
