<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductStockAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // positivo = se encontró/cargó más stock (reposición, conteo), negativo = merma/faltante.
            'delta' => ['required', 'numeric', Rule::notIn([0])],
            'note' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'delta.required' => 'La cantidad a ajustar es requerida.',
            'delta.numeric' => 'La cantidad a ajustar debe ser un número válido.',
            'delta.not_in' => 'La cantidad a ajustar no puede ser cero.',
            'note.max' => 'La nota no puede superar los 255 caracteres.',
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
