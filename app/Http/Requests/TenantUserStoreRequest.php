<?php

namespace App\Http\Requests;

use App\Enums\RoleEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class TenantUserStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->route('tenant')?->id;

        return [
            'nombre' => 'required|string|max:100',
            'apellido_paterno' => 'required|string|max:100',
            'apellido_materno' => 'nullable|string|max:100',
            'email' => 'required|email|unique:users,email',
            // usuario único por tenant, no global — no se usa para login (eso es email, ver
            // AuthService::login), así que no hay razón para bloquear "admin" en un tenant
            // porque otro tenant ya lo usa.
            'usuario' => ['required', 'string', 'max:80', Rule::unique('users', 'usuario')->where('tenant_id', $tenantId)],
            'password' => 'required|string|min:8',
            'rol_id' => ['required', new Enum(RoleEnum::class)],
            'activo' => 'boolean',
            // Solo aplica a roles distintos de Admin (Admin siempre tiene acceso a todas
            // las sucursales sin necesidad de asignación — ver User::authorizedBranchIds()).
            'branch_ids' => 'nullable|array',
            'branch_ids.*' => [
                'integer',
                Rule::exists('branches', 'id')->where('tenant_id', $tenantId),
            ],
        ];
    }
}
