<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeAbsenceModel extends Model
{
    use HasFactory, HasTenant;

    protected $table = 'employee_absences';

    const EMPLOYEE_ID = 'employee_id';

    const DATE = 'date';

    const NOTIFIED = 'notified';

    const DEDUCTION_AMOUNT = 'deduction_amount';

    const NOTES = 'notes';

    const TENANT_ID = 'tenant_id';

    protected $fillable = [
        self::EMPLOYEE_ID,
        self::DATE,
        self::NOTIFIED,
        self::DEDUCTION_AMOUNT,
        self::NOTES,
        self::TENANT_ID,
    ];

    // DATE sin cast: el frontend espera "YYYY-MM-DD" tal cual devuelve la columna DATE de
    // MySQL. El cast 'date' de Eloquent lo serializaría como datetime ISO completo
    // ("2026-08-05T06:00:00.000000Z"), rompiendo las comparaciones de rango por string.
    protected $casts = [
        self::NOTIFIED => 'boolean',
        self::DEDUCTION_AMOUNT => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(EmployeeModel::class, self::EMPLOYEE_ID);
    }
}
