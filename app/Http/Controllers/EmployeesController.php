<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Http\Requests\EmployeePayrollSummaryRequest;
use App\Http\Requests\EmployeeStoreRequest;
use App\Http\Requests\EmployeeUpdateRequest;
use App\Models\EmployeeModel;
use App\Services\EmployeePayrollService;
use App\Services\EmployeeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class EmployeesController extends Controller
{
    public function index(IndexData $data, EmployeeService $service): JsonResponse
    {
        return $service->run($data);
    }

    public function list(): JsonResponse
    {
        $employees = EmployeeModel::select('id', 'name', 'phone')
            ->where(EmployeeModel::ACTIVE, true)
            ->orderBy('name')
            ->get();

        return Response::success($employees);
    }

    public function payrollSummary(EmployeePayrollSummaryRequest $params, EmployeePayrollService $service): JsonResponse
    {
        return Response::success($service->summary($params->period()));
    }

    public function store(EmployeeStoreRequest $params): JsonResponse
    {
        $employee = EmployeeModel::create([
            EmployeeModel::NAME => $params->name,
            EmployeeModel::PHONE => $params->phone,
            EmployeeModel::SALARY => $params->salary,
            EmployeeModel::SALARY_PERIOD => $params->salary_period,
            EmployeeModel::WORK_DAYS => $params->work_days,
            EmployeeModel::ACTIVE => true,
        ]);

        return Response::success($employee);
    }

    public function show(EmployeeModel $employee): JsonResponse
    {
        return Response::success($employee);
    }

    public function update(EmployeeModel $employee, EmployeeUpdateRequest $params): JsonResponse
    {
        $employee->update([
            EmployeeModel::NAME => $params->name,
            EmployeeModel::PHONE => $params->phone,
            EmployeeModel::SALARY => $params->salary,
            EmployeeModel::SALARY_PERIOD => $params->salary_period,
            EmployeeModel::WORK_DAYS => $params->work_days,
        ]);

        return Response::success($employee);
    }

    public function delete(EmployeeModel $employee): JsonResponse
    {
        return Response::success($employee->delete());
    }

    public function toggleActive(EmployeeModel $employee): JsonResponse
    {
        $employee->update([
            EmployeeModel::ACTIVE => ! $employee->active,
        ]);

        return Response::success($employee);
    }
}
