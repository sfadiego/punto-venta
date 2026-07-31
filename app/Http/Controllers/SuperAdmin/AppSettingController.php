<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Enums\AppThemeEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\AppSettingUpdateRequest;
use App\Models\AppSettingModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class AppSettingController extends Controller
{
    public function show(): JsonResponse
    {
        return Response::success([
            'logo_upload_enabled' => (bool) AppSettingModel::getValue('logo_upload_enabled', '0'),
            'payment_info' => json_decode(AppSettingModel::getValue('payment_info', 'null'), true),
            'theme' => AppSettingModel::getValue('theme', AppThemeEnum::AmberOrange->value),
        ]);
    }

    public function update(AppSettingUpdateRequest $request): JsonResponse
    {
        if ($request->has('logo_upload_enabled')) {
            AppSettingModel::setValue('logo_upload_enabled', $request->boolean('logo_upload_enabled') ? '1' : '0');
        }

        if ($request->has('payment_info')) {
            AppSettingModel::setValue('payment_info', json_encode($request->input('payment_info')));
        }

        if ($request->has('theme')) {
            AppSettingModel::setValue('theme', $request->input('theme'));
        }

        return Response::success([
            'logo_upload_enabled' => (bool) AppSettingModel::getValue('logo_upload_enabled', '0'),
            'payment_info' => json_decode(AppSettingModel::getValue('payment_info', 'null'), true),
            'theme' => AppSettingModel::getValue('theme', AppThemeEnum::AmberOrange->value),
        ]);
    }
}
