<?php

namespace App\Http\Requests;

use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        // Cocina y Caja no existen como roles asignables en negocios de venta por peso ni en
        // retail — ver useUsersPage.ts en el frontend, que ya excluye estos mismos roles al
        // crear usuarios, y RolePermissionController, que aplica la misma regla a permisos.
        $allowedRoles = [RoleEnum::ADMIN->value, RoleEnum::EMPLOYE->value];
        if (! BusinessConfigModel::excludesCocinaCajaRoles($tenantId)) {
            $allowedRoles[] = RoleEnum::COCINA->value;
            $allowedRoles[] = RoleEnum::CAJA->value;
        }

        return [
            'nombre' => 'required|string|max:100',
            'apellido_paterno' => 'required|string|max:100',
            'apellido_materno' => 'nullable|string|max:100',
            'email' => ['required', 'email', Rule::unique('users', 'email')],
            'usuario' => ['required', 'string', 'max:80', Rule::unique('users', 'usuario')],
            'password' => ['required', 'string', 'min:8'],
            'rol_id' => ['required', Rule::in($allowedRoles)],
            'activo' => 'boolean',
        ];
    }
}
