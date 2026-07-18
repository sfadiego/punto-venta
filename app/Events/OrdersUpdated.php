<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrdersUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $type = 'updated',
        public readonly ?int $orderId = null,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('orders')];
    }

    public function broadcastAs(): string
    {
        return 'orders.updated';
    }

    public function broadcastWith(): array
    {
        $payload = ['type' => $this->type];
        if ($this->orderId !== null) {
            $payload['order_id'] = $this->orderId;
        }

        return $payload;
    }
}
