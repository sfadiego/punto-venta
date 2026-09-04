<?php

namespace App\Enums;

enum ClientLeadStatusEnum: string
{
    case FollowUp = 'follow_up';
    case Customer = 'customer';
    case Discarded = 'discarded';

    public function label(): string
    {
        return match ($this) {
            self::FollowUp => 'Seguimiento',
            self::Customer => 'Cliente',
            self::Discarded => 'Descartado',
        };
    }
}
