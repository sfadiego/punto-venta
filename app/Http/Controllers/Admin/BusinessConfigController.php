<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\BusinessConfigUpdateRequest;
use App\Models\AppSettingModel;
use App\Models\ProductImageModel;
use Carbon\Carbon;
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
            'printer_name' => $request->printer_name,
            'printer_host' => $request->printer_host,
            'logo_icon' => $request->logo_icon,
            'costo_domicilio_default' => $request->costo_domicilio_default ?? 0,
            'menu_enabled' => $request->boolean('menu_enabled'),
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
        $tenant = $request->user()->tenant;

        return Response::success([
            'status' => $tenant->subscription_status,
            'plan' => $tenant->subscription_plan,
            'days_remaining' => $tenant->subscription_expires_at
                ? (int) Carbon::today()->diffInDays($tenant->subscription_expires_at, false)
                : null,
            'expires_at' => $tenant->subscription_expires_at?->toDateString(),
            'business_name' => $tenant->business_name,
            'payment_whatsapp' => env('PAYMENT_WHATSAPP'),
            'payment_info' => json_decode(AppSettingModel::getValue('payment_info', 'null'), true),
            'amount_due' => $tenant->subscription_amount,
        ]);
    }
}
