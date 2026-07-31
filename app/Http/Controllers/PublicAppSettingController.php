<?php

namespace App\Http\Controllers;

use App\Enums\AppThemeEnum;
use App\Models\AppSettingModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class PublicAppSettingController extends Controller
{
    public function theme(): JsonResponse
    {
        return Response::success([
            'theme' => AppSettingModel::getValue('theme', AppThemeEnum::AmberOrange->value),
        ]);
    }
}
