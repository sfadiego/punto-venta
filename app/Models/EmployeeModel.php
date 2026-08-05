<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeModel extends Model
{
    use HasFactory, HasTenant, SoftDeletes;

    protected $table = 'employees';

    const NAME = 'name';

    const PHONE = 'phone';

    const SALARY = 'salary';

    const SALARY_PERIOD = 'salary_period';

    const WORK_DAYS = 'work_days';

    const ACTIVE = 'active';

    const TENANT_ID = 'tenant_id';

    protected $fillable = [
        self::NAME,
        self::PHONE,
        self::SALARY,
        self::SALARY_PERIOD,
        self::WORK_DAYS,
        self::ACTIVE,
        self::TENANT_ID,
    ];

    protected $casts = [
        self::ACTIVE => 'boolean',
        self::SALARY => 'decimal:2',
        self::WORK_DAYS => 'array',
    ];
}
