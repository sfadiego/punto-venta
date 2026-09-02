<?php

namespace App\Services;

use App\Enums\OrderStatusEnum;
use App\Events\OrdersUpdated;
use App\Exceptions\InsufficientStockException;
use App\Exceptions\PublicOrderUnavailableException;
use App\Http\Requests\PublicOrderStoreRequest;
use App\Models\BusinessConfigModel;
use App\Models\CustomerModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;

/**
 * Crea una orden desde el menú público (sin autenticación) — espejo de OrderSaleService
 * para el flujo de venta directa autenticado, pero con alta/actualización de cliente por
 * teléfono y validación de que el negocio acepte pedidos en este momento.
 */
class PublicOrderService
{
    /**
     * @throws PublicOrderUnavailableException
     * @throws InsufficientStockException
     */
    public function createFromMenu(BusinessConfigModel $tenant, PublicOrderStoreRequest $request): OrderModel
    {
        if (! $tenant->menu_enabled) {
            throw new PublicOrderUnavailableException('Los pedidos en línea no están disponibles en este momento.');
        }

        $activeSale = (new MainOrderReportModel)->getActiveSale();
        if (! $activeSale) {
            throw new PublicOrderUnavailableException(
                'El negocio no tiene una sesión activa en este momento. Intenta más tarde o comunícate directamente con nosotros.'
            );
        }

        $isDelivery = $request->boolean('is_delivery');
        $customer = $this->upsertCustomer($tenant, $request, $isDelivery);

        $order = OrderModel::create([
            OrderModel::TENANT_ID => $tenant->id,
            OrderModel::SISTEMA_ID => $activeSale->id,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::PENDING_CONFIRMATION->value,
            OrderModel::NOMBRE_PEDIDO => $request->customer_name,
            OrderModel::CUSTOMER_ID => $customer->id,
            OrderModel::IS_DELIVERY => $isDelivery,
            OrderModel::DELIVERY_ADDRESS => $request->delivery_address,
            OrderModel::DELIVERY_REFERENCE => $request->delivery_reference,
            OrderModel::COSTO_DOMICILIO => $isDelivery ? ($tenant->costo_domicilio_default ?? 0) : 0,
            OrderModel::TOTAL => 0,
            OrderModel::SUBTOTAL => 0,
        ]);

        foreach ($request->items as $item) {
            $this->addItem($order, $tenant, $item);
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

        return $order;
    }

    private function upsertCustomer(BusinessConfigModel $tenant, PublicOrderStoreRequest $request, bool $isDelivery): CustomerModel
    {
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

            return $customer;
        }

        return CustomerModel::create([
            CustomerModel::TENANT_ID => $tenant->id,
            CustomerModel::NAME => $request->customer_name,
            CustomerModel::PHONE => $request->customer_phone,
            CustomerModel::ADDRESS => $isDelivery ? $request->delivery_address : null,
            CustomerModel::DELIVERY_REFERENCE => $isDelivery ? $request->delivery_reference : null,
            CustomerModel::ALLOW_CREDIT => false,
        ]);
    }

    /**
     * @throws InsufficientStockException
     */
    private function addItem(OrderModel $order, BusinessConfigModel $tenant, array $item): void
    {
        $product = ProductModel::withoutGlobalScopes()
            ->where('id', $item['product_id'])
            ->where('tenant_id', $tenant->id)
            ->where(ProductModel::ACTIVO, true)
            ->firstOrFail();

        if ($product->manage_stock && (float) $item['cantidad'] > (float) $product->stock) {
            throw new InsufficientStockException(
                "No hay suficiente stock disponible de \"{$product->nombre}\" ({$product->stock} disponibles)."
            );
        }

        $precio = $product->precio;
        $variantId = $item['variant_id'] ?? null;
        if ($variantId) {
            $variant = ProductVariantModel::withoutGlobalScopes()
                ->where('id', $variantId)
                ->where(ProductVariantModel::PRODUCT_ID, $product->id)
                ->where('tenant_id', $tenant->id)
                ->firstOrFail();
            $precio = $variant->precio;
        }

        OrderProductModel::create([
            'pedido_id' => $order->id,
            'producto_id' => $product->id,
            OrderProductModel::VARIANT_ID => $variantId,
            'cantidad' => $item['cantidad'],
            'precio' => $precio,
            'descuento' => 0,
            OrderProductModel::OBSERVACION => $item['observacion'] ?? null,
        ]);
    }
}
