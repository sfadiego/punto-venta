<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExpenseStoreRequest;
use App\Models\ExpenseModel;
use App\Models\MainOrderReportModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class ExpensesController extends Controller
{
    public function index(MainOrderReportModel $system): JsonResponse
    {
        return Response::success(
            ExpenseModel::where(ExpenseModel::SISTEMA_ID, $system->id)
                ->with('user:id,nombre')
                ->orderByDesc('created_at')
                ->get()
        );
    }

    public function store(MainOrderReportModel $system, ExpenseStoreRequest $params): JsonResponse
    {
        $expense = ExpenseModel::create([
            ExpenseModel::SISTEMA_ID => $system->id,
            ExpenseModel::USER_ID => auth()->id(),
            ExpenseModel::CONCEPTO => $params->concepto,
            ExpenseModel::MONTO => $params->monto,
            ExpenseModel::OBSERVACIONES => $params->observaciones,
        ]);

        return Response::success($expense->load('user:id,nombre'));
    }
}
