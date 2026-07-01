<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
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
            User::EMAIL => 'required|email|unique:users',
            User::USUARIO => 'required|unique:users',
            User::NOMBRE => 'required',
            User::APELLIDO_PATERNO => 'required|string',
            User::APELLIDO_MATERNO => 'nullable|string',
            User::ROL_ID => 'required|exists:role,id',
            'password' => 'required|min:8|regex:/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()]{8,}$/|confirmed',
            'password_confirmation' => 'required_with:password|same:password',
        ];
    }

    public function attributes(): array
    {
        return [];
    }
}
