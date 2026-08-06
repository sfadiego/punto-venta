<?php

namespace App\Http\Requests;

use App\Models\EmployeeAbsenceModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmployeeAbsenceStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $employeeId = $this->route('employee')?->id;

        return [
            EmployeeAbsenceModel::DATE => [
                'required',
                'date',
                Rule::unique('employee_absences', 'date')->where('employee_id', $employeeId),
            ],
            EmployeeAbsenceModel::NOTIFIED => 'required|boolean',
            EmployeeAbsenceModel::DEDUCTION_AMOUNT => 'nullable|numeric|min:0',
            EmployeeAbsenceModel::NOTES => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'date.required' => 'La fecha es requerida.',
            'date.date' => 'La fecha no es válida.',
            'date.unique' => 'Ya existe una falta registrada para esta fecha.',
            'notified.required' => 'Indica si el empleado avisó con anticipación.',
            'notified.boolean' => 'El campo de aviso debe ser verdadero o falso.',
            'deduction_amount.numeric' => 'El monto a descontar debe ser un número.',
            'deduction_amount.min' => 'El monto a descontar no puede ser negativo.',
            'notes.string' => 'Las notas deben ser texto.',
            'notes.max' => 'Las notas no pueden superar los 500 caracteres.',
        ];
    }

    public function attributes(): array
    {
        return [
            'date' => 'fecha',
            'notified' => 'aviso previo',
            'deduction_amount' => 'monto a descontar',
            'notes' => 'notas',
        ];
    }
}
