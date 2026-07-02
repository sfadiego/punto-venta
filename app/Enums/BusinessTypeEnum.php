<?php

namespace App\Enums;

enum BusinessTypeEnum: string
{
    case Restaurante = 'restaurante';
    case VentaPorPeso = 'venta_por_peso';

    public function label(): string
    {
        return match ($this) {
            self::Restaurante => 'Servicio en mesa / mostrador',
            self::VentaPorPeso => 'Venta por peso',
        };
    }

    /** Features habilitados por tipo de negocio */
    public function features(): array
    {
        return match ($this) {
            self::Restaurante => [
                'kitchen_view' => true,
                'ready_to_serve' => true,
                'sell_by_weight' => false,
            ],
            self::VentaPorPeso => [
                'kitchen_view' => false,
                'ready_to_serve' => false,
                'sell_by_weight' => true,
            ],
            default => [
                'kitchen_view' => true,
                'ready_to_serve' => true,
                'sell_by_weight' => false,
            ],
        };
    }
}
