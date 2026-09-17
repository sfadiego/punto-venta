<?php

namespace App\Models;

use App\Enums\MainOrderStatusEnum;
use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class BranchModel extends Model
{
    use HasFactory, HasTenant, SoftDeletes;

    protected $table = 'branches';

    const NAME = 'name';

    const ADDRESS = 'address';

    const PHONE = 'phone';

    const ACTIVE = 'active';

    const TENANT_ID = 'tenant_id';

    protected $fillable = [
        self::NAME,
        self::ADDRESS,
        self::PHONE,
        self::ACTIVE,
        self::TENANT_ID,
    ];

    protected $casts = [
        self::ACTIVE => 'boolean',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_branch', 'branch_id', 'user_id');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(MainOrderReportModel::class, MainOrderReportModel::BRANCH_ID);
    }

    public function hasOpenCashRegister(): bool
    {
        return $this->sales()
            ->where(MainOrderReportModel::ESTATUS_CAJA, MainOrderStatusEnum::OPEN)
            ->exists();
    }

    /**
     * withoutGlobalScopes() + tenant_id explícito: se llama tanto desde el flujo del
     * tenant Admin (donde el scope ya filtraría solo) como desde SuperAdmin (sin
     * ResolveTenant, donde el scope es un no-op) — mismo criterio que
     * BranchActivationService para no depender de app('tenant_id').
     */
    public function isOnlyActiveBranch(): bool
    {
        return self::withoutGlobalScopes()
            ->where(self::TENANT_ID, $this->tenant_id)
            ->where(self::ACTIVE, true)
            ->where('id', '!=', $this->id)
            ->doesntExist();
    }

    /**
     * Mensaje de error si esta sucursal NO puede desactivarse/eliminarse ahora (caja
     * abierta, o es la única activa del tenant), o null si la acción es segura. Usado
     * por BranchesController (tenant) y SuperAdmin\TenantBranchController — antes
     * duplicado en los 3 call sites, extraído aquí a la tercera repetición.
     */
    public function deactivationBlockReason(string $action = 'desactivar'): ?string
    {
        if ($this->hasOpenCashRegister()) {
            return "No puedes {$action} esta sucursal: tiene una caja abierta ahora mismo.";
        }

        if ($this->isOnlyActiveBranch()) {
            return "No puedes {$action} la única sucursal activa del negocio.";
        }

        return null;
    }
}
