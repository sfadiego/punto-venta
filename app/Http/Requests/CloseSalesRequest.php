<?php

namespace App\Http\Requests;

use App\Models\MainOrderReportModel;
use Illuminate\Foundation\Http\FormRequest;

class CloseSalesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            MainOrderReportModel::EMPTY_CLOSE_REASON => 'nullable|string|min:5|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            MainOrderReportModel::EMPTY_CLOSE_REASON.'.min' => 'El motivo debe tener al menos 5 caracteres.',
        ];
    }
}
