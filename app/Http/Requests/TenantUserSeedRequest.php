<?php

namespace App\Http\Requests;

use App\Models\BranchModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class TenantUserSeedRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->route('tenant')?->id;

        return [
            'branch_id' => [
                'nullable', 'integer',
                Rule::exists('branches', 'id')->where('tenant_id', $tenantId),
            ],
        ];
    }

    /**
     * Con una sola sucursal no hace falta preguntar (se autoasigna en el controller); con
     * cero, no aplica. Solo con 2+ sucursales branch_id es realmente obligatorio, porque
     * ahí sí hay una decisión ambigua que el SuperAdmin debe resolver explícitamente.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $tenantId = $this->route('tenant')?->id;
            $branchCount = BranchModel::withoutGlobalScopes()
                ->where(BranchModel::TENANT_ID, $tenantId)
                ->count();

            if ($branchCount > 1 && ! $this->filled('branch_id')) {
                $validator->errors()->add('branch_id', 'Selecciona una sucursal.');
            }
        });
    }
}
