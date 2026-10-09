<?php

namespace App\Http\Controllers;

use App\Core\Enums\Http;
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
            return Response::error('Negocio no encontrado.', null, Http::NotFound);
        }

        if (! $tenant->activo) {
            return Response::error(
                'Este negocio ha sido desactivado temporalmente. Contacta al administrador.',
                null,
                Http::Forbidden,
                'TENANT_INACTIVE',
            );
        }

        return Response::success($tenant);
    }
}
