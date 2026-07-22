<?php

namespace App\Http\Controllers;

use App\Models\BusinessConfigModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class TenantController extends Controller
{
    /** Endpoint público: devuelve la configuración de branding por slug (para la pantalla de login). */
    public function show(string $slug): JsonResponse
    {
        $tenant = BusinessConfigModel::where(BusinessConfigModel::SLUG, $slug)->first();

        if (! $tenant) {
            return Response::json(['message' => 'Negocio no encontrado.'], 404);
        }

        if (! $tenant->activo) {
            return Response::json([
                'message' => 'Este negocio ha sido desactivado temporalmente. Contacta al administrador.',
                'code' => 'TENANT_INACTIVE',
            ], 403);
        }

        return Response::success($tenant);
    }
}
