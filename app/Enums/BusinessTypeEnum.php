<?php

namespace App\Enums;

enum BusinessTypeEnum: string
{
    case Restaurante = 'restaurante';
    case VentaPorPeso = 'venta_por_peso';
    case Retail = 'retail';

    public function label(): string
    {
        return match ($this) {
            self::Restaurante => 'Servicio en mesa / mostrador',
            self::VentaPorPeso => 'Venta por peso',
            self::Retail => 'Tienda / mostrador',
        };
    }

    /** Features habilitados por tipo de negocio */
    public function features(): array
    {
        return match ($this) {
            self::Restaurante => [
                'kitchen_view' => true,
                'order_served' => true,
                'sell_by_weight' => false,
            ],
            self::VentaPorPeso => [
                'kitchen_view' => false,
                'order_served' => false,
                'sell_by_weight' => true,
            ],
            // Retail (chucherías, juguetes, cosméticos, etc.): mismo flujo de venta que
            // Restaurante (stock, sin báscula) pero sin conceptos de mesa/cocina/servido —
            // es venta de mostrador, no servicio en mesa.
            self::Retail => [
                'kitchen_view' => false,
                'order_served' => false,
                'sell_by_weight' => false,
            ],
            default => [
                'kitchen_view' => true,
                'order_served' => true,
                'sell_by_weight' => false,
            ],
        };
    }
}
