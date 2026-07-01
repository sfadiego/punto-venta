<?php

namespace App\Models;

use App\Enums\SubscriptionPlanEnum;
use App\Enums\SubscriptionStatusEnum;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionModel extends Model
{
    protected $table = 'subscriptions';

    const TENANT_ID = 'tenant_id';

    const PLAN = 'plan';

    const STARTS_AT = 'starts_at';

    const EXPIRES_AT = 'expires_at';

    const PAID_AT = 'paid_at';

    const AMOUNT = 'amount';

    const NOTES = 'notes';

    const GRACE_DAYS = 3;

    protected $fillable = [
        self::TENANT_ID,
        self::PLAN,
        self::STARTS_AT,
        self::EXPIRES_AT,
        self::PAID_AT,
        self::AMOUNT,
        self::NOTES,
    ];

    protected $casts = [
        self::STARTS_AT => 'date',
        self::EXPIRES_AT => 'date',
        self::PAID_AT => 'datetime',
        self::AMOUNT => 'float',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(BusinessConfigModel::class, self::TENANT_ID);
    }

    public function getIsLifetimeAttribute(): bool
    {
        return $this->plan === SubscriptionPlanEnum::Lifetime->value;
    }

    public function getStatusAttribute(): string
    {
        if ($this->is_lifetime) {
            return SubscriptionStatusEnum::Active->value;
        }

        $now = Carbon::today();
        $expires = Carbon::parse($this->expires_at);

        if ($expires->gte($now)) {
            return SubscriptionStatusEnum::Active->value;
        }

        if ($expires->gte($now->copy()->subDays(self::GRACE_DAYS))) {
            return SubscriptionStatusEnum::Grace->value;
        }

        return SubscriptionStatusEnum::Expired->value;
    }

    public function getDaysRemainingAttribute(): ?int
    {
        if ($this->is_lifetime) {
            return null;
        }

        return (int) Carbon::today()->diffInDays(Carbon::parse($this->expires_at), false);
    }

    public static function createFromPlan(int $tenantId, SubscriptionPlanEnum $plan, Carbon $startsAt, ?float $amount, ?string $notes): self
    {
        // lifetime no tiene fecha de vencimiento real; usamos una fecha muy lejana
        $expiresAt = $plan->isLifetime()
            ? Carbon::parse('2099-12-31')
            : $startsAt->copy()->addMonths($plan->months());

        return self::create([
            self::TENANT_ID => $tenantId,
            self::PLAN => $plan->value,
            self::STARTS_AT => $startsAt,
            self::EXPIRES_AT => $expiresAt,
            self::PAID_AT => now(),
            self::AMOUNT => $amount,
            self::NOTES => $notes,
        ]);
    }
}
