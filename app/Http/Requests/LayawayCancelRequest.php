<?php

namespace App\Http\Requests;

use App\Enums\MainOrderStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LayawayCancelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Caja de la que sale el reembolso.
            'sistema_id' => ['required', Rule::exists('main_order_report', 'id')
                ->where('tenant_id', app('tenant_id'))
                ->where('estatus_caja', MainOrderStatusEnum::OPEN->value)],
            'payment_method_id' => 'nullable|exists:payment_methods,id',
            // Parte de lo abonado que el negocio retiene (0 = reembolso total); el tope contra lo abonado
            // lo valida LayawayService::cancel().
            'retained_amount' => 'nullable|numeric|min:0',
            'note' => 'nullable|string|max:500',
        ];
    }
}
