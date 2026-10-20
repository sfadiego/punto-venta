<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductBarcodeCatalogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // El frontend lo manda como 1/0: la regla `boolean` de Laravel no acepta "true"/"false".
            'include_barcode' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'include_barcode.boolean' => 'La opción de incluir el código de barras no es válida.',
        ];
    }

    /** Ausente (o vacío) = incluir el código de barras, el comportamiento original del catálogo. */
    public function includeBarcode(): bool
    {
        return $this->filled('include_barcode') ? $this->boolean('include_barcode') : true;
    }
}
