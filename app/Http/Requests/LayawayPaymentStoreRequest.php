<?php

namespace App\Http\Requests;

use App\Enums\MainOrderStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LayawayPaymentStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => 'required|numeric|min:0.01',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'sistema_id' => ['required', Rule::exists('main_order_report', 'id')
                ->where('tenant_id', app('tenant_id'))
                ->where('estatus_caja', MainOrderStatusEnum::OPEN->value)],
            'note' => 'nullable|string|max:500',
        ];
    }
}
