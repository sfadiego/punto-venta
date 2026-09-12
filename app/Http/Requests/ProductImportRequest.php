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
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Selecciona un archivo CSV.',
            'file.mimes' => 'El archivo debe ser un CSV.',
            'file.max' => 'El archivo no puede superar los 5 MB.',
        ];
    }
}
