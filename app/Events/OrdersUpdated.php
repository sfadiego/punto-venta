<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class OrdersUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $type = 'updated',
        public readonly ?int $orderId = null,
    ) {}

    /**
     * El broadcast es una llamada HTTP síncrona a Reverb — nunca debe correr mientras una
     * fila de orden sigue bloqueada por lockForUpdate(), o requests concurrentes sobre la
     * misma orden se encolan detrás del lock además de la latencia del broadcast. Se difiere
     * con DB::afterCommit y se traga cualquier falla — Reverb caído no debe tumbar la
     * operación de negocio que disparó el evento.
     */
    public static function dispatchAfterCommit(string $type = 'updated', ?int $orderId = null): void
    {
        DB::afterCommit(function () use ($type, $orderId) {
            try {
                self::dispatch($type, $orderId);
            } catch (\Throwable) {
            }
        });
    }

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
