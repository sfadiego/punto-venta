<?php

namespace App\Rules;

use App\Models\AddonModel;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * El nombre de un topping es único por cliente (tenant), sin distinguir mayúsculas ni
 * espacios sobrantes ("Nieve" y " nieve " son el mismo topping). Rule::unique() depende de la
 * colación de la base (MySQL ignora mayúsculas, SQLite no), así que la comparación se hace
 * explícita con LOWER() para que el resultado no cambie según el motor. Los toppings
 * eliminados (soft delete) no cuentan: su nombre puede reutilizarse.
 */
class UniqueAddonName implements ValidationRule
{
    public function __construct(private readonly ?int $ignoreId = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        $exists = AddonModel::query()
            ->where(AddonModel::TENANT_ID, $tenantId)
            ->whereRaw('LOWER('.AddonModel::NAME.') = ?', [mb_strtolower(trim((string) $value))])
            ->when($this->ignoreId, fn ($query) => $query->where('id', '!=', $this->ignoreId))
            ->exists();

        if ($exists) {
            $fail('Ya existe un topping con este nombre.');
        }
    }
}
