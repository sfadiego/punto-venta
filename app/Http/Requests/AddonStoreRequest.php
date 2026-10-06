<?php

namespace App\Http\Requests;

use App\Models\AddonModel;
use App\Rules\UniqueAddonName;
use Illuminate\Foundation\Http\FormRequest;

class AddonStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            AddonModel::NAME => [
                'required', 'string', 'max:255',
                new UniqueAddonName,
            ],
            AddonModel::PRICE => 'nullable|numeric|min:0|max:99999',
            AddonModel::IS_ACTIVE => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es requerido.',
            'name.max' => 'El nombre no puede superar los 255 caracteres.',
            'price.numeric' => 'El precio debe ser un número.',
            'price.min' => 'El precio no puede ser negativo.',
            'price.max' => 'El precio es demasiado grande.',
        ];
    }
}
