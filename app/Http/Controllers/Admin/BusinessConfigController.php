<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SubscriptionStatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\BusinessConfigUpdateRequest;
use App\Models\AppSettingModel;
use App\Models\ProductImageModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class BusinessConfigController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $tenantModel = $request->user()->tenant;
        $tenant = $tenantModel->toArray();
        $tenant['logo_upload_enabled'] = (bool) AppSettingModel::getValue('logo_upload_enabled', '0');
        $tenant['features'] = $tenantModel->tipo_negocio->features();

        return Response::success($tenant);
    }

    public function update(BusinessConfigUpdateRequest $request): JsonResponse
    {
        $tenant = $request->user()->tenant;
        $tenant->update([
            'business_name' => $request->business_name,
            'primary_color' => $request->primary_color,
            'sidebar_color' => $request->sidebar_color,
            'font_color' => $request->font_color,
            'label_color' => $request->label_color,
            'phone' => $request->phone,
            'address' => $request->address,
            'facebook' => $request->facebook,
            'instagram' => $request->instagram,
            'whatsapp' => $request->whatsapp,
            'website' => $request->website,
            'ticket_footer' => $request->ticket_footer,
            'printer_name'            => $request->printer_name,
            'printer_host'            => $request->printer_host,
            'logo_icon'               => $request->logo_icon,
            'costo_domicilio_default' => $request->costo_domicilio_default ?? 0,
            'delivery_paid_by'        => $request->delivery_paid_by ?? 'customer',
        ]);

        return Response::success($tenant->fresh());
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate(['logo' => 'required|image|mimes:png,jpg,jpeg,webp|max:2048']);

        $tenant = $request->user()->tenant;
        $upload = ProductImageModel::processImage($request->file('logo'), $tenant->slug);

        if (! $upload) {
            return Response::error('No se pudo subir el logo');
        }

        ProductImageModel::deleteFile($tenant->logo_path);
        $tenant->update(['logo_path' => $upload['nombre_archivo']]);

        return Response::success($tenant->fresh());
    }

    public function removeLogo(Request $request): JsonResponse
    {
        $tenant = $request->user()->tenant;
        ProductImageModel::deleteFile($tenant->logo_path);
        $tenant->update(['logo_path' => null]);

        return Response::success($tenant->fresh());
    }

    public function subscriptionStatus(Request $request): JsonResponse
    {
        $tenant = $request->user()->tenant->load('latestSubscription');
        $sub = $tenant->latestSubscription;

        if (! $sub) {
            return Response::success(['status' => SubscriptionStatusEnum::Pending->value, 'days_remaining' => null, 'is_lifetime' => false]);
        }

        return Response::success([
            'status' => $sub->status,
            'days_remaining' => $sub->days_remaining,
            'is_lifetime' => $sub->is_lifetime,
            'expires_at' => $sub->is_lifetime ? null : $sub->expires_at->toDateString(),
        ]);
    }
}
