<?php

namespace App\Enums;

enum OrderStatusEnum: int
{
    case IN_PROCESS = 1;
    case CANCELED = 2;
    case CLOSED = 3;
    case DELETED = 4;
    case SERVED = 5;
    case PENDING_CONFIRMATION = 6;

    public static function orderStatusName(OrderStatusEnum $status): string
    {
        return match ($status->value) {
            OrderStatusEnum::IN_PROCESS->value => 'in process',
            OrderStatusEnum::CANCELED->value => 'canceled',
            OrderStatusEnum::CLOSED->value => 'closed',
            OrderStatusEnum::DELETED->value => 'deleted',
            OrderStatusEnum::SERVED->value => 'order served',
            OrderStatusEnum::PENDING_CONFIRMATION->value => 'pending confirmation',
            default => 'in process',
        };
    }
}
