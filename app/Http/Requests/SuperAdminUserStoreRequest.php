<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SuperAdminUserStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:100',
            'apellido_paterno' => 'required|string|max:100',
            'apellido_materno' => 'nullable|string|max:100',
            'email' => 'required|email|unique:users,email',
            'usuario' => 'required|string|max:80|unique:users,usuario',
            // rol_id nunca viene del cliente: este endpoint solo lo alcanza un SuperAdmin ya
            // autenticado (SuperAdminMiddleware) y siempre crea SUPERADMIN — ver el hallazgo
            // de seguridad que forzó a hacer lo mismo en RegisterRequest/UserUpdateRequest.
            'password' => [
                'required', 'string', 'min:8',
                'regex:/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()]{8,}$/',
                'confirmed',
            ],
        ];
    }
}
