<?php

namespace App\Http\Requests;

use App\Models\EmployeeModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmployeeStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            EmployeeModel::NAME => 'required|string|max:255',
            EmployeeModel::PHONE => 'nullable|string|max:20',
            EmployeeModel::SALARY => 'required|numeric|min:0',
            EmployeeModel::SALARY_PERIOD => ['required', Rule::in(['daily', 'weekly', 'weekend', 'biweekly', 'monthly'])],
            EmployeeModel::WORK_DAYS => 'required|array|min:1',
            EmployeeModel::WORK_DAYS.'.*' => Rule::in(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
        ];
    }
}
