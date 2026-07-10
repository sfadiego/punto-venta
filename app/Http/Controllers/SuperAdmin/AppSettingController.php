<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AppSettingModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class AppSettingController extends Controller
{
    public function show(): JsonResponse
    {
        return Response::success([
            'logo_upload_enabled' => (bool) AppSettingModel::getValue('logo_upload_enabled', '0'),
            'payment_info'        => json_decode(AppSettingModel::getValue('payment_info', 'null'), true),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'logo_upload_enabled'    => 'sometimes|boolean',
            'payment_info'           => 'sometimes|array',
            'payment_info.bank'      => 'required_with:payment_info|string|max:100',
            'payment_info.account'   => 'required_with:payment_info|string|max:30',
            'payment_info.holder'    => 'required_with:payment_info|string|max:150',
            'payment_info.concept'   => 'nullable|string|max:150',
        ]);

        if ($request->has('logo_upload_enabled')) {
            AppSettingModel::setValue('logo_upload_enabled', $request->boolean('logo_upload_enabled') ? '1' : '0');
        }

        if ($request->has('payment_info')) {
            AppSettingModel::setValue('payment_info', json_encode($request->input('payment_info')));
        }

        return Response::success([
            'logo_upload_enabled' => (bool) AppSettingModel::getValue('logo_upload_enabled', '0'),
            'payment_info'        => json_decode(AppSettingModel::getValue('payment_info', 'null'), true),
        ]);
    }
}
