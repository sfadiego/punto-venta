<?php

namespace App\Http\Requests;

use App\Models\EmployeeModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmployeeUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $perDayPeriods = ['daily', 'weekly', 'weekend'];

        return [
            EmployeeModel::NAME => 'required|string|max:255',
            EmployeeModel::PHONE => 'nullable|string|max:20',
            EmployeeModel::SALARY => 'required|numeric|min:0',
            EmployeeModel::SALARY_PERIOD => ['required', Rule::in(['daily', 'weekly', 'weekend', 'biweekly', 'monthly'])],
            EmployeeModel::WORK_DAYS => in_array($this->input(EmployeeModel::SALARY_PERIOD), $perDayPeriods, true)
                ? 'required|array|min:1'
                : 'nullable|array',
            EmployeeModel::WORK_DAYS.'.*' => Rule::in(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es requerido.',
            'name.string' => 'El nombre debe ser texto.',
            'name.max' => 'El nombre no puede superar los 255 caracteres.',
            'phone.string' => 'El teléfono debe ser texto.',
            'phone.max' => 'El teléfono no puede superar los 20 caracteres.',
            'salary.required' => 'El salario es requerido.',
            'salary.numeric' => 'El salario debe ser un número.',
            'salary.min' => 'El salario no puede ser negativo.',
            'salary_period.required' => 'La periodicidad de pago es requerida.',
            'salary_period.in' => 'La periodicidad de pago seleccionada no es válida.',
            'work_days.required' => 'Selecciona al menos un día laboral.',
            'work_days.array' => 'Los días laborales no tienen un formato válido.',
            'work_days.min' => 'Selecciona al menos un día laboral.',
            'work_days.*.in' => 'Uno de los días laborales seleccionados no es válido.',
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nombre',
            'phone' => 'teléfono',
            'salary' => 'salario',
            'salary_period' => 'periodicidad de pago',
            'work_days' => 'días laborales',
        ];
    }
}
