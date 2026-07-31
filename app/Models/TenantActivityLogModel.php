<?php

namespace App\Models;

use App\Enums\ActivityTypeEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenantActivityLogModel extends Model
{
    use HasFactory;

    protected $table = 'tenant_activity_logs';

    public $timestamps = false;

    const TENANT_ID = 'tenant_id';

    const TYPE = 'type';

    const CREATED_AT = 'created_at';

    protected $fillable = [
        self::TENANT_ID,
        self::TYPE,
        self::CREATED_AT,
    ];

    protected $casts = [
        self::TYPE => ActivityTypeEnum::class,
    ];
}
