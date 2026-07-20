<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CustomerPaymentStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => 'required|numeric|min:0.01',
            'note' => 'nullable|string|max:500',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $customer = $this->route('customer');
            if ($customer && $this->filled('amount') && (float) $this->input('amount') > (float) $customer->balance) {
                $validator->errors()->add('amount', 'El abono no puede exceder el adeudo actual.');
            }
        });
    }
}
