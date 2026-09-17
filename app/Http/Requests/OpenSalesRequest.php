<?php

namespace App\Http\Requests;

use App\Models\BusinessConfigModel;
use App\Models\MainOrderReportModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OpenSalesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Autorización por campo: si se envía branch_id, el usuario debe tener acceso
     * otorgado a esa sucursal (Admin siempre pasa vía User::canAccessBranch()).
     */
    public function authorize(): bool
    {
        $branchId = $this->input(MainOrderReportModel::BRANCH_ID);

        if ($branchId === null) {
            return true;
        }

        return (bool) $this->user()?->canAccessBranch((int) $branchId);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;
        $multiBranchEnabled = (bool) (BusinessConfigModel::find($tenantId)?->multi_branch_enabled);

        return [
            MainOrderReportModel::USER_ID => 'required|exists:users,id',
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 'required',
            MainOrderReportModel::OBSERVACION => 'nullable',
            MainOrderReportModel::BRANCH_ID => [
                Rule::requiredIf($multiBranchEnabled),
                'nullable',
                Rule::exists('branches', 'id')->where('tenant_id', $tenantId)->where('active', true),
            ],
        ];
    }
}
