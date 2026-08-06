<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmployeeAbsenceStoreRequest;
use App\Models\EmployeeAbsenceModel;
use App\Models\EmployeeModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class EmployeeAbsenceController extends Controller
{
    public function index(EmployeeModel $employee): JsonResponse
    {
        $absences = $employee->absences()->orderByDesc(EmployeeAbsenceModel::DATE)->get();

        return Response::success($absences);
    }

    public function store(EmployeeModel $employee, EmployeeAbsenceStoreRequest $params): JsonResponse
    {
        $absence = $employee->absences()->create([
            EmployeeAbsenceModel::DATE => $params->date,
            EmployeeAbsenceModel::NOTIFIED => $params->notified,
            EmployeeAbsenceModel::DEDUCTION_AMOUNT => $params->boolean('notified') ? null : $params->deduction_amount,
            EmployeeAbsenceModel::NOTES => $params->notes,
        ]);

        return Response::success($absence);
    }

    public function delete(EmployeeModel $employee, EmployeeAbsenceModel $absence): JsonResponse
    {
        return Response::success($absence->delete());
    }
}
