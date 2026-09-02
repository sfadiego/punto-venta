<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;

class RolePermissionConfig extends Model
{
    use HasTenant;

    protected $table = 'role_permission_configs';

    const TENANT_ID = 'tenant_id';

    const ROLE_ID = 'role_id';

    protected $fillable = [
        self::TENANT_ID,
        self::ROLE_ID,
    ];
}
