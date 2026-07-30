<?php

namespace App\Http\Requests;

use App\Enums\RoleEnum;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user') instanceof User
            ? $this->route('user')->id
            : $this->route('user');

        return [
            'nombre' => 'required|string|max:100',
            'apellido_paterno' => 'required|string|max:100',
            'apellido_materno' => 'nullable|string|max:100',
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'usuario' => ['required', 'string', 'max:80', Rule::unique('users', 'usuario')->ignore($userId)],
            'password' => 'nullable|string|min:8',
            // Esta ruta solo la alcanza un Admin de tenant (gate 'role.admin'). Nunca debe
            // poder asignar SUPERADMIN — ese rol se gestiona exclusivamente desde el panel
            // SuperAdmin, fuera del contexto de un tenant.
            'rol_id' => ['required', Rule::in([
                RoleEnum::ADMIN->value,
                RoleEnum::EMPLOYE->value,
                RoleEnum::COCINA->value,
                RoleEnum::CAJA->value,
            ])],
            'activo' => 'required|boolean',
        ];
    }
}
