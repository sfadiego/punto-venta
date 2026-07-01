<?php

namespace App\Http\Requests;

use App\Models\OrderProductModel;
use Illuminate\Foundation\Http\FormRequest;

class OrderProductUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            OrderProductModel::DESCUENTO => 'integer|max:99|min:0',
            OrderProductModel::CANTIDAD => 'integer|max:10|min:1',
            OrderProductModel::OBSERVACION => 'nullable|string|max:200',
        ];
    }
}
