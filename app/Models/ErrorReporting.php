<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ErrorReporting extends Model
{
    protected $table = 'error_reporting';

    protected $fillable = [
        'source',
        'endpoint',
        'method',
        'status_code',
        'error_message',
        'stack_trace',
        'user_id',
        'tenant_slug',
        'request_payload',
        'response_body',
        'user_agent',
        'url',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'request_payload' => 'array',
        'response_body' => 'array',
    ];

    public function scopeFrontend($query)
    {
        return $query->where('source', 'frontend');
    }

    public function scopeBackend($query)
    {
        return $query->where('source', 'backend');
    }
}
