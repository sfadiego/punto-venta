<?php

namespace App\Enums;

/** Motivo de una devolución de venta (retail). El motivo decide el destino de la pieza. */
enum ReturnReasonEnum: string
{
    case Defective = 'defective';
    case NotWanted = 'not_wanted';
    case Other = 'other';

    /** Texto para tickets y reportes. */
    public function label(): string
    {
        return match ($this) {
            self::Defective => 'Producto defectuoso',
            self::NotWanted => 'No era lo que esperaba',
            self::Other => 'Otro motivo',
        };
    }

    /** Una pieza defectuosa no vuelve al stock vendible: se da de baja como merma. */
    public function returnsToSellableStock(): bool
    {
        return $this !== self::Defective;
    }
}
