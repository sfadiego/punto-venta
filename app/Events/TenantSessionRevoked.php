<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Support\Facades\DB;

/**
 * Avisa a los navegadores abiertos de un tenant que sus sesiones fueron revocadas (tenant desactivado o
 * borrado) para que cierren sesión al instante en vez de esperar su siguiente petición. Reusa el canal
 * privado `orders.{tenantId}`, que ya autoriza solo a los usuarios de ese tenant.
 *
 * Es un complemento: si Reverb está caído el evento se pierde, y la persona sale igual en su siguiente
 * petición (401 por token revocado o TENANT_INACTIVE de ResolveTenant).
 */
class TenantSessionRevoked implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public readonly int $tenantId) {}

    /**
     * Se emite después del commit, para que el aviso no llegue antes de que los tokens estén revocados, y
     * se traga cualquier falla: Reverb caído no debe impedir desactivar o borrar el tenant. El tenant va
     * explícito porque en una petición de SuperAdmin `app('tenant_id')` es nulo.
     */
    public static function dispatchAfterCommit(int $tenantId): void
    {
        DB::afterCommit(function () use ($tenantId) {
            try {
                self::dispatch($tenantId);
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
        return 'tenant.session-revoked';
    }

    public function broadcastWith(): array
    {
        return [];
    }
}
