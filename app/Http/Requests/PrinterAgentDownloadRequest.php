<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PrinterAgentDownloadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'printer' => 'required|string|max:100',
            'port' => 'nullable|integer|min:1024|max:65535',
            'platform' => 'required|in:win,mac',
        ];
    }
}
