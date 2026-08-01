<?php

namespace App\Enums;

enum UnidadMedidaEnum: string
{
    case Unidad = 'unidad';
    case Kg = 'kg';
    case Gr = 'gr';
    case Litro = 'litro';

    public function label(): string
    {
        return match ($this) {
            self::Unidad => 'Unidad',
            self::Kg => 'Kilogramo (kg)',
            self::Gr => 'Gramo (gr)',
            self::Litro => 'Litro (L)',
        };
    }

    public function esPeso(): bool
    {
        return match ($this) {
            self::Kg, self::Gr, self::Litro => true,
            self::Unidad => false,
        };
    }
}
