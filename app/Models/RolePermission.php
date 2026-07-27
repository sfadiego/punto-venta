<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RolePermission extends Model
{
    use HasTenant;

    protected $table = 'role_permissions';

    const TENANT_ID = 'tenant_id';

    const ROLE_ID = 'role_id';

    const PERMISSION_ID = 'permission_id';

    protected $fillable = [
        self::TENANT_ID,
        self::ROLE_ID,
        self::PERMISSION_ID,
    ];

    public function permission(): BelongsTo
    {
        return $this->belongsTo(Permission::class, self::PERMISSION_ID);
    }
}
