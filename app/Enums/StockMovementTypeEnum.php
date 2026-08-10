<?php

namespace App\Enums;

enum StockMovementTypeEnum: string
{
    case Entry = 'entry';
    case Exit = 'exit';
    case Adjustment = 'adjustment';
}
