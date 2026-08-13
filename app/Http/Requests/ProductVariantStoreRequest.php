<?php

namespace App\Http\Requests;

use App\Enums\UnidadMedidaEnum;
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
            $product = $this->route('product');

            // Un producto por kg/gr/litro ya resuelve su "precio variable" vía báscula —
            // mezclar eso con variantes de precio fijo es incoherente. Un producto por
            // "unidad" sí puede tenerlas (ej. venta por pieza además del paquete), sea cual
            // sea el tipo de negocio.
            if ($product && $product->unidad_medida !== UnidadMedidaEnum::Unidad) {
                $validator->errors()->add('nombre', 'Solo los productos por unidad admiten variantes.');
            }

            // Una venta por variante no descuenta stock (ver OrderSaleService) — mezclarlo con
            // manage_stock dejaría el inventario del producto base desincronizado.
            if ($product && $product->manage_stock) {
                $validator->errors()->add('nombre', 'Un producto que maneja stock no admite variantes.');
            }
        });
    }
}
