<?php

namespace App\Enums;

enum LayawayPaymentTypeEnum: string
{
    case Deposit = 'deposit';
    case Refund = 'refund';

    // Parte del anticipo que el negocio se queda al cancelar un apartado — queda en el historial, pero no
    // es un movimiento de caja (el dinero ya entró cuando se cobró el anticipo).
    case Forfeit = 'forfeit';
}
