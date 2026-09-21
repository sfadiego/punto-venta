<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class DashboardController extends Controller
{
    public function index(DashboardService $service): JsonResponse
    {
        return Response::success($service->summary());
    }
}
