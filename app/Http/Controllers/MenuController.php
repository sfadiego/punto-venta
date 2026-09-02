<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Core\Enums\Http;
use App\Exceptions\InsufficientStockException;
use App\Exceptions\PublicOrderUnavailableException;
use App\Http\Requests\PublicOrderStoreRequest;
use App\Models\BusinessConfigModel;
use App\Models\CustomerModel;
use App\Models\MainOrderReportModel;
use App\Services\MenuService;
use App\Services\PublicOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class MenuController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        $tenant = $this->resolveTenantOrFail($slug);
        if ($tenant instanceof JsonResponse) {
            return $tenant;
        }

        $hasActiveSession = (new MainOrderReportModel)->getActiveSale() !== null;

        $features = $tenant->tipo_negocio->features();

        return Response::success([
            'business_name' => $tenant->business_name,
            'phone' => $tenant->phone,
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
        $tenant = $this->resolveTenantOrFail($slug);
        if ($tenant instanceof JsonResponse) {
            return $tenant;
        }

        return $service->run($data);
    }

    public function customerLookup(Request $request, string $slug): JsonResponse
    {
        $phone = $request->query('phone', '');

        if (strlen((string) $phone) < 10) {
            return Response::success(null);
        }

        $tenant = $this->resolveTenantOrFail($slug);
        if ($tenant instanceof JsonResponse) {
            return $tenant;
        }

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

    public function store(PublicOrderStoreRequest $request, string $slug, PublicOrderService $service): JsonResponse
    {
        $tenant = $this->resolveTenantOrFail($slug);
        if ($tenant instanceof JsonResponse) {
            return $tenant;
        }

        try {
            $order = $service->createFromMenu($tenant, $request);
        } catch (PublicOrderUnavailableException|InsufficientStockException $e) {
            return Response::error($e->getMessage());
        }

        return Response::success([
            'order_id' => $order->id,
            'nombre_pedido' => $order->nombre_pedido,
            'total' => $order->total,
        ], null, Http::Created);
    }

    /**
     * resolveTenantOrFail — resuelve el tenant por slug y fija tenant_id en el contenedor
     * (esta ruta corre antes de ResolveTenant, no hay tenant autenticado que lo haga por
     * nosotros). Devuelve el JsonResponse de "no encontrado" listo para retornar si falla,
     * en vez de una excepción, para no forzar un try/catch en cada acción pública.
     */
    private function resolveTenantOrFail(string $slug): BusinessConfigModel|JsonResponse
    {
        $tenant = BusinessConfigModel::where(BusinessConfigModel::SLUG, $slug)
            ->where('activo', true)
            ->first();

        if (! $tenant) {
            return Response::error('Negocio no encontrado', null, Http::NotFound);
        }

        app()->instance('tenant_id', $tenant->id);

        return $tenant;
    }
}
