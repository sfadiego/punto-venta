<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExpenseStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'concepto' => 'required|string|max:255',
            'monto' => 'required|numeric|min:0.01|max:999999.99',
            'observaciones' => 'nullable|string|max:500',
        ];
    }
}
