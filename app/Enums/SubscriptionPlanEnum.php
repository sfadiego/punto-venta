<?php

namespace App\Enums;

enum SubscriptionPlanEnum: string
{
    case Weekly   = 'weekly';
    case Biweekly = 'biweekly';
    case Monthly  = 'monthly';
    case Biannual = 'biannual';
    case Annual   = 'annual';
    case Lifetime = 'lifetime';

    public function weeks(): int
    {
        return match ($this) {
            self::Weekly   => 1,
            self::Biweekly => 2,
            default        => 0,
        };
    }

    public function months(): int
    {
        return match ($this) {
            self::Monthly  => 1,
            self::Biannual => 6,
            self::Annual   => 12,
            default        => 0,
        };
    }

    public function isLifetime(): bool
    {
        return $this === self::Lifetime;
    }

    public function isWeekBased(): bool
    {
        return $this === self::Weekly || $this === self::Biweekly;
    }

    public function label(): string
    {
        return match ($this) {
            self::Weekly   => 'Semanal',
            self::Biweekly => 'Quincenal',
            self::Monthly  => 'Mensual',
            self::Biannual => 'Semestral',
            self::Annual   => 'Anual',
            self::Lifetime => 'Membresía indefinida',
        };
    }
}
