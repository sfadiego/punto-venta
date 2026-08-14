<?php

namespace App\Enums;

enum IconSourceEnum: string
{
    case Lucide = 'lucide';
    case Openmoji = 'openmoji';
    case Native = 'native';

    public function label(): string
    {
        return match ($this) {
            self::Lucide => 'Ícono',
            self::Openmoji => 'Imagen',
            self::Native => 'Emoji',
        };
    }
}
