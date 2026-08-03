<?php

namespace App\Enums;

enum BusinessNicheEnum: string
{
    case Taqueria = 'taqueria';
    case Restaurante = 'restaurante';
    case Cafeteria = 'cafeteria';
    case Pasteleria = 'pasteleria';
    case Carniceria = 'carniceria';
    case Cremeria = 'cremeria';
    case Verduleria = 'verduleria';
    case BarCantina = 'bar_cantina';
    case Otro = 'otro';

    public function label(): string
    {
        return match ($this) {
            self::Taqueria => 'Taquería',
            self::Restaurante => 'Restaurante',
            self::Cafeteria => 'Cafetería',
            self::Pasteleria => 'Pastelería',
            self::Carniceria => 'Carnicería',
            self::Cremeria => 'Cremería',
            self::Verduleria => 'Verdulería',
            self::BarCantina => 'Bar / Cantina',
            self::Otro => 'Otro',
        };
    }
}
