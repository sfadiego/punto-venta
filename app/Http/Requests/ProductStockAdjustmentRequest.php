<?php

namespace App\Http\Requests;

use App\Services\StockService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductStockAdjustmentRequest extends FormRequest
{
    // Mismo tope que StockService::MAX_STOCK — sin esta validación, un reajuste mal tecleado
    // (ej. un cero de más) fallaría con un error crudo de la base de datos en vez de un
    // mensaje de validación claro.
    public const MAX_DELTA = StockService::MAX_STOCK;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // positivo = se encontró/cargó más stock (reposición, conteo), negativo = merma/faltante.
            'delta' => ['required', 'numeric', Rule::notIn([0]), 'min:-'.self::MAX_DELTA, 'max:'.self::MAX_DELTA],
            'note' => 'nullable|string|max:255',
            'variant_id' => [
                'nullable',
                Rule::exists('product_variants', 'id')->where('product_id', $this->route('product')?->id),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'delta.required' => 'La cantidad a ajustar es requerida.',
            'delta.numeric' => 'La cantidad a ajustar debe ser un número válido.',
            'delta.not_in' => 'La cantidad a ajustar no puede ser cero.',
            'delta.min' => 'La cantidad a ajustar no puede ser menor a -'.self::MAX_DELTA.'.',
            'delta.max' => 'La cantidad a ajustar no puede ser mayor a '.self::MAX_DELTA.'.',
            'note.max' => 'La nota no puede superar los 255 caracteres.',
            'variant_id.exists' => 'La variante seleccionada no pertenece a este producto.',
        ];
    }

    public function attributes(): array
    {
        return [
            'delta' => 'cantidad a ajustar',
            'note' => 'nota',
        ];
    }
}
