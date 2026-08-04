<?php

namespace App\Http\Requests;

use App\Models\BusinessConfigModel;
use App\Models\ProductVariantModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ProductVariantStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ProductVariantModel::NOMBRE => 'required|string|max:100',
            ProductVariantModel::PRECIO => 'required|decimal:0,2',
            ProductVariantModel::ORDEN => 'nullable|integer|min:0',
            ProductVariantModel::ACTIVO => 'bool',
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre de la variante es requerido.',
            'nombre.max' => 'El nombre no puede superar los 100 caracteres.',
            'precio.required' => 'El precio es requerido.',
            'precio.decimal' => 'El precio debe ser un número válido con hasta 2 decimales.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;
            $sellByWeight = BusinessConfigModel::find($tenantId)?->tipo_negocio->features()['sell_by_weight'] ?? false;

            // Venta por peso ya resuelve su propio "precio variable" vía unidad_medida
            // (kg/gr/litro) — mezclar eso con variantes de precio fijo es incoherente.
            if ($sellByWeight) {
                $validator->errors()->add('nombre', 'Los productos de negocios de venta por peso no admiten variantes.');
            }
        });
    }
}
