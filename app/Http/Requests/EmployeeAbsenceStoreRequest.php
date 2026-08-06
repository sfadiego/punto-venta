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
}
