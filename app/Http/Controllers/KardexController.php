<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Services\KardexService;
use Illuminate\Http\JsonResponse;

class KardexController extends Controller
{
    public function index(IndexData $data, KardexService $service): JsonResponse
    {
        return $service->run($data);
    }
}
