<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Core\Enums\Http;
use App\Enums\OrderStatusEnum;
use App\Events\OrdersUpdated;
use App\Http\Requests\PublicOrderStoreRequest;
use App\Models\BusinessConfigModel;
use App\Models\CustomerModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\ProductModel;
use App\Services\MenuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        $features = $tenant->tipo_negocio->features();

        return Response::success([
            'business_name' => $tenant->business_name,
            'primary_color' => $tenant->primary_color,
            'logo' => $tenant->logo_path,
            'costo_domicilio_default' => $tenant->costo_domicilio_default ?? 0,
            'has_active_session' => $hasActiveSession,
            'menu_enabled' => (bool) $tenant->menu_enabled,
            'sell_by_weight' => (bool) ($features['sell_by_weight'] ?? false),
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

    public function customerLookup(Request $request, string $slug): JsonResponse
    {
        $phone = $request->query('phone', '');

        if (strlen((string) $phone) < 10) {
            return Response::success(null);
        }

        $tenant = BusinessConfigModel::where(BusinessConfigModel::SLUG, $slug)
            ->where('activo', true)
            ->firstOrFail();

        $customer = CustomerModel::withoutGlobalScopes()
            ->where(CustomerModel::TENANT_ID, $tenant->id)
            ->where(CustomerModel::PHONE, $phone)
            ->first([
                CustomerModel::NAME,
                CustomerModel::ADDRESS,
                CustomerModel::DELIVERY_REFERENCE,
            ]);

        if (! $customer) {
            return Response::success(null);
        }

        return Response::success([
            'customer_name' => $customer->name,
            'delivery_address' => $customer->address,
            'delivery_reference' => $customer->delivery_reference,
        ]);
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

        $isDelivery = $request->boolean('is_delivery');

        $customer = CustomerModel::withoutGlobalScopes()
            ->where(CustomerModel::TENANT_ID, $tenant->id)
            ->where(CustomerModel::PHONE, $request->customer_phone)
            ->first();

        if ($customer) {
            $updates = [CustomerModel::NAME => $request->customer_name];
            if ($isDelivery && $request->delivery_address) {
                $updates[CustomerModel::ADDRESS] = $request->delivery_address;
                $updates[CustomerModel::DELIVERY_REFERENCE] = $request->delivery_reference;
            }
            $customer->update($updates);
        } else {
            $customer = CustomerModel::create([
                CustomerModel::TENANT_ID => $tenant->id,
                CustomerModel::NAME => $request->customer_name,
                CustomerModel::PHONE => $request->customer_phone,
                CustomerModel::ADDRESS => $isDelivery ? $request->delivery_address : null,
                CustomerModel::DELIVERY_REFERENCE => $isDelivery ? $request->delivery_reference : null,
                CustomerModel::ALLOW_CREDIT => false,
            ]);
        }

        $order = OrderModel::create([
            OrderModel::TENANT_ID => $tenant->id,
            OrderModel::SISTEMA_ID => $activeSale->id,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::PENDING_CONFIRMATION->value,
            OrderModel::NOMBRE_PEDIDO => $request->customer_name,
            OrderModel::CUSTOMER_ID => $customer->id,
            OrderModel::IS_DELIVERY => $isDelivery,
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
