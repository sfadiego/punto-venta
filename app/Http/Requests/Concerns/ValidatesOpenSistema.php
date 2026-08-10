<?php

namespace App\Http\Requests\Concerns;

use App\Enums\MainOrderStatusEnum;
use App\Models\MainOrderReportModel;
use Illuminate\Validation\Validator;

trait ValidatesOpenSistema
{
    /**
     * Agrega un error a `sistema_id` si la caja referenciada ya está cerrada. Se ejecuta
     * como after-hook (no como regla de `rules()`) porque solo debe correr una vez que
     * `exists` ya confirmó que el registro existe para este tenant — evita pisar ese
     * mensaje con uno distinto cuando el sistema_id ni siquiera es válido.
     */
    protected function assertSistemaAbierto(Validator $validator, ?int $tenantId): void
    {
        $sistemaId = $this->input('sistema_id');
        if (! $sistemaId) {
            return;
        }

        $sistema = MainOrderReportModel::where('id', $sistemaId)
            ->where('tenant_id', $tenantId)
            ->first();

        if ($sistema && $sistema->estatus_caja !== MainOrderStatusEnum::OPEN->value) {
            $validator->errors()->add('sistema_id', 'La caja de esta venta ya está cerrada.');
        }
    }
}
