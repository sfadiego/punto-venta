<?php

namespace App\Enums;

enum StockMovementReasonEnum: string
{
    case Sale = 'sale';
    case Return = 'return';
    case ManualAdjustment = 'manual_adjustment';
    case Loss = 'loss';
    case InitialStock = 'initial_stock';
    case Layaway = 'layaway';
    case LayawayCancel = 'layaway_cancel';
}
