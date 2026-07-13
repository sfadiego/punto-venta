<?php

namespace App\Services;

use App\Core\Data\IndexData;
use App\Core\Paginator\DataTable;
use App\Enums\RoleEnum;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class UserService extends DataTable
{
    public function __construct(User $model)
    {
        parent::__construct($model);
    }

    public function tableHeaders(): array
    {
        return [
            'nombre' => 'Nombre',
            'usuario' => 'Usuario',
            'email' => 'Email',
            'rol_id' => 'Rol',
            'activo' => 'Estado',
        ];
    }

    public function makeQuery(): Builder
    {
        $query = $this->model->newQuery()
            ->where(User::ROL_ID, '!=', RoleEnum::SUPERADMIN->value);

        $search = request()->query('search');
        if ($search) {
            $query->where(function (Builder $q) use ($search) {
                $q->where(User::NOMBRE, 'like', "%{$search}%")
                    ->orWhere(User::APELLIDO_PATERNO, 'like', "%{$search}%")
                    ->orWhere(User::USUARIO, 'like', "%{$search}%")
                    ->orWhere(User::EMAIL, 'like', "%{$search}%");
            });
        }

        return $query;
    }

    public function run(IndexData $data): JsonResponse
    {
        return parent::build($data);
    }
}
