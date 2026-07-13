<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PublicOrderStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_name' => 'required|string|max:100',
            'customer_phone' => 'required|string|max:20',
            'is_delivery' => 'required|boolean',
            'delivery_address' => 'required_if:is_delivery,true|nullable|string|max:500',
            'delivery_reference' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.cantidad' => 'required|integer|min:1',
            'items.*.observacion' => 'nullable|string|max:200',
        ];
    }
}
