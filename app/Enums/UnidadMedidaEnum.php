<?php

namespace App\Enums;

enum UnidadMedidaEnum: string
{
    case Unidad = 'unidad';
    case Kg = 'kg';
    case Gr = 'gr';

    public function label(): string
    {
        return match ($this) {
            self::Unidad => 'Unidad',
            self::Kg => 'Kilogramo (kg)',
            self::Gr => 'Gramo (gr)',
        };
    }

    public function esPeso(): bool
    {
        return match ($this) {
            self::Kg, self::Gr => true,
            self::Unidad => false,
        };
    }
}
