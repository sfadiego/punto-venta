<?php

namespace App\Rules;

use App\Models\BusinessConfigModel;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Rechaza una selección de toppings con contenido en negocios que no son restaurante/cafetería.
 * Una lista vacía siempre pasa: no cambia nada para los demás tipos de negocio.
 */
class AddonsEnabledForTenant implements ValidationRule
{
    public const MESSAGE = 'Los toppings solo están disponibles en negocios de tipo restaurante o cafetería.';

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value)) {
            return;
        }

        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        if (! BusinessConfigModel::supportsAddons($tenantId)) {
            $fail(self::MESSAGE);
        }
    }
}
