<?php

namespace App\Http\Requests;

use App\Enums\RoleEnum;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            /** @var User $user */
            $user = $this->route('user');

            if (! $user instanceof User || $user->rol_id !== RoleEnum::ADMIN->value) {
                return;
            }

            $staysAdmin = (int) $this->input('rol_id') === RoleEnum::ADMIN->value;
            $staysActive = (bool) $this->input('activo');

            if ($staysAdmin && $staysActive) {
                return;
            }

            $otherActiveAdmins = User::where(User::TENANT_ID, $user->tenant_id)
                ->where(User::ROL_ID, RoleEnum::ADMIN->value)
                ->where(User::ACTIVO, true)
                ->where('id', '!=', $user->id)
                ->exists();

            if (! $otherActiveAdmins) {
                $reason = 'No se puede quitar el rol de administrador ni desactivar a este usuario porque es el único administrador activo del negocio.';
                $validator->errors()->add('rol_id', $reason);
                $validator->errors()->add('activo', $reason);
            }
        });
    }
}
