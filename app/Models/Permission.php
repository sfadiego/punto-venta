<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    protected $table = 'permissions';

    const KEY = 'key';

    const LABEL = 'label';

    protected $fillable = [
        self::KEY,
        self::LABEL,
    ];
}
