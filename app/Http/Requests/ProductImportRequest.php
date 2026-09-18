<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
            // Solo los usa commit() — el frontend parte archivos grandes en chunks y reenvía
            // el mismo archivo con un rango distinto en cada llamada. Ausentes = procesar todo
            // el archivo de una vez (preview() nunca los manda).
            'offset' => ['nullable', 'integer', 'min:0'],
            'limit' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Selecciona un archivo CSV.',
            'file.mimes' => 'El archivo debe ser un CSV.',
            'file.max' => 'El archivo no puede superar los 5 MB.',
            'offset.integer' => 'El offset debe ser un número entero.',
            'limit.integer' => 'El límite debe ser un número entero.',
        ];
    }
}
