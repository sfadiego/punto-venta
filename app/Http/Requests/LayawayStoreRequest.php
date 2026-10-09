<?php

namespace App\Http\Requests;

use App\Enums\MainOrderStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LayawayStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = app('tenant_id');

        return [
            'customer_id' => ['required', Rule::exists('customers', 'id')->where('tenant_id', $tenantId)],
            'amount' => 'required|numeric|min:0.01',
            'payment_method_id' => 'required|exists:payment_methods,id',
            // Caja donde se recibe el anticipo — debe estar abierta, o el dinero quedaría fuera
            // de cualquier cuadre de caja.
            'sistema_id' => ['required', Rule::exists('main_order_report', 'id')
                ->where('tenant_id', $tenantId)
                ->where('estatus_caja', MainOrderStatusEnum::OPEN->value)],
            'due_date' => 'nullable|date|after_or_equal:today',
            'note' => 'nullable|string|max:500',
        ];
    }
}
