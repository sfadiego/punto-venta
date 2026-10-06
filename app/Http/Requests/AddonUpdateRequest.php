<?php

namespace App\Http\Requests;

use App\Models\AddonModel;
use App\Rules\UniqueAddonName;
use Illuminate\Foundation\Http\FormRequest;

class AddonUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $addon = $this->route('addon');

        return [
            AddonModel::NAME => [
                'sometimes', 'required', 'string', 'max:255',
                new UniqueAddonName($addon instanceof AddonModel ? $addon->id : (int) $addon),
            ],
            AddonModel::PRICE => 'sometimes|required|numeric|min:0|max:99999',
            AddonModel::IS_ACTIVE => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es requerido.',
            'name.max' => 'El nombre no puede superar los 255 caracteres.',
            'price.required' => 'El precio es requerido.',
            'price.numeric' => 'El precio debe ser un número.',
            'price.min' => 'El precio no puede ser negativo.',
            'price.max' => 'El precio es demasiado grande.',
        ];
    }
}
