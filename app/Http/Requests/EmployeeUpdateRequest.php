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
}
