<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmployeePayrollSummaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'period' => ['nullable', Rule::in(['week', 'month'])],
        ];
    }

    public function messages(): array
    {
        return [
            'period.in' => 'El periodo debe ser "week" o "month".',
        ];
    }

    public function period(): string
    {
        return $this->query('period', 'month');
    }
}
