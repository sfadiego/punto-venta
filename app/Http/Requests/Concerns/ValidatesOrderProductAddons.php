<?php

namespace App\Http\Requests\Concerns;

use App\Models\BusinessConfigModel;
use App\Rules\AddonsEnabledForTenant;
use App\Services\OrderProductAddonService;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Reglas compartidas por las tres requests que aceptan toppings en una línea de orden
 * (alta individual, alta en lote y edición).
 */
trait ValidatesOrderProductAddons
{
    /** @param  string  $prefix  ruta del arreglo de la línea, ej. '' o 'items.*.' */
    protected function addonRules(string $prefix = ''): array
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        return [
            $prefix.'addons' => 'nullable|array|max:30',
            $prefix.'addons.*.addon_id' => [
                'required',
                'integer',
                Rule::exists('addons', 'id')->where('tenant_id', $tenantId)->whereNull('deleted_at'),
            ],
            $prefix.'addons.*.quantity' => 'required|integer|min:1|max:99',
        ];
    }

    /** @param  array<string, array{producto_id: ?int, addons: mixed}>  $lines */
    protected function validateAddonSelections(Validator $validator, array $lines): void
    {
        $lines = array_filter($lines, fn (array $line) => is_array($line['addons'] ?? null) && $line['addons'] !== []);
        if ($lines === []) {
            return;
        }

        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;
        if (! BusinessConfigModel::supportsAddons($tenantId)) {
            foreach (array_keys($lines) as $prefix) {
                $validator->errors()->add(($prefix === '' ? '' : $prefix.'.').'addons', AddonsEnabledForTenant::MESSAGE);
            }

            return;
        }

        foreach (app(OrderProductAddonService::class)->validationErrors($lines) as $field => $message) {
            $validator->errors()->add($field, $message);
        }
    }

    protected function addonMessages(): array
    {
        return [
            'addons.array' => 'Los toppings deben enviarse como lista.',
            'addons.max' => 'Una línea admite hasta 30 toppings distintos.',
            'addons.*.addon_id.required' => 'Indica el topping.',
            'addons.*.addon_id.exists' => 'El topping seleccionado no existe.',
            'addons.*.quantity.required' => 'Indica la cantidad del topping.',
            'addons.*.quantity.integer' => 'La cantidad del topping debe ser un número entero.',
            'addons.*.quantity.min' => 'La cantidad del topping debe ser al menos 1.',
            'addons.*.quantity.max' => 'La cantidad del topping no puede superar 99.',
        ];
    }
}
