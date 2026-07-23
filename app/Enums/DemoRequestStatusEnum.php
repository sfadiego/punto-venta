<?php

namespace App\Enums;

enum DemoRequestStatusEnum: string
{
    case Pending = 'pending';
    case Contacted = 'contacted';
    case Converted = 'converted';
    case Discarded = 'discarded';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pendiente',
            self::Contacted => 'Contactado',
            self::Converted => 'Convertido',
            self::Discarded => 'Descartado',
        };
    }
}
