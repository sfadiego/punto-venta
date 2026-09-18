<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
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
        public readonly ?int $tenantId = null,
    ) {}

    /**
     * El broadcast es una llamada HTTP síncrona a Reverb — nunca debe correr mientras una
     * fila de orden sigue bloqueada por lockForUpdate(), o requests concurrentes sobre la
     * misma orden se encolan detrás del lock además de la latencia del broadcast. Se difiere
     * con DB::afterCommit y se traga cualquier falla — Reverb caído no debe tumbar la
     * operación de negocio que disparó el evento.
     *
     * `$tenantId` default a `app('tenant_id')` (bindeado por ResolveTenant para requests
     * autenticadas) — se captura AQUÍ, no dentro del closure diferido, porque el binding es
     * del contenedor de esta request y no debe asumirse vivo para cuando el closure corra tras
     * el commit. Flujos sin usuario autenticado (ej. PublicOrderService, menú público) deben
     * pasar el tenant explícito, ya que ahí `app('tenant_id')` nunca se bindea.
     */
    public static function dispatchAfterCommit(string $type = 'updated', ?int $orderId = null, ?int $tenantId = null): void
    {
        $tenantId ??= app()->bound('tenant_id') ? app('tenant_id') : null;

        DB::afterCommit(function () use ($type, $orderId, $tenantId) {
            try {
                self::dispatch($type, $orderId, $tenantId);
            } catch (\Throwable) {
            }
        });
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel("orders.{$this->tenantId}")];
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
