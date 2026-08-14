<?php

namespace App\Http\Requests;

use App\Enums\IconSourceEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BusinessConfigUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'business_name' => 'required|string|max:100',
            'primary_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'sidebar_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'font_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'label_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:200',
            'facebook' => 'nullable|string|max:100',
            'instagram' => 'nullable|string|max:100',
            'whatsapp' => 'nullable|string|max:30',
            'website' => 'nullable|url|max:200',
            'ticket_footer' => 'nullable|string|max:100',
            'printer_name' => 'nullable|string|max:100',
            'printer_host' => 'nullable|string|max:100',
            'paper_width' => 'nullable|in:58,80',
            'logo_icon' => 'nullable|string|max:50',
            'logo_icon_source' => ['nullable', Rule::enum(IconSourceEnum::class)],
            'costo_domicilio_default' => 'nullable|numeric|min:0',
            'menu_enabled' => 'nullable|boolean',
        ];
    }
}
