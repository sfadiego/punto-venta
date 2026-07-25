<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpenseModel extends Model
{
    use HasFactory, HasTenant;

    protected $table = 'expenses';

    const SISTEMA_ID = 'sistema_id';

    const USER_ID = 'user_id';

    const CONCEPTO = 'concepto';

    const MONTO = 'monto';

    const OBSERVACIONES = 'observaciones';

    const TENANT_ID = 'tenant_id';

    protected $fillable = [
        self::SISTEMA_ID,
        self::USER_ID,
        self::CONCEPTO,
        self::MONTO,
        self::OBSERVACIONES,
        self::TENANT_ID,
    ];

    protected $casts = [
        self::MONTO => 'decimal:2',
    ];

    public function sistema(): BelongsTo
    {
        return $this->belongsTo(MainOrderReportModel::class, self::SISTEMA_ID);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, self::USER_ID);
    }
}
