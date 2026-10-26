<?php

namespace Tests\Events;

use App\Events\TenantSessionRevoked;
use Illuminate\Broadcasting\PrivateChannel;
use Tests\TestCase;

/**
 * TenantSessionRevoked reusa el canal privado `orders.{tenantId}`, cuya autorización
 * (routes/channels.php) ya limita la suscripción a los usuarios de ese tenant.
 */
class TenantSessionRevokedTest extends TestCase
{
    public function test_broadcast_on_usa_el_canal_privado_del_tenant(): void
    {
        $channels = (new TenantSessionRevoked(42))->broadcastOn();

        $this->assertCount(1, $channels);
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
        $this->assertSame('private-orders.42', $channels[0]->name);
    }

    public function test_el_nombre_del_evento_coincide_con_el_que_escucha_el_frontend(): void
    {
        $this->assertSame('tenant.session-revoked', (new TenantSessionRevoked(1))->broadcastAs());
    }

    public function test_el_payload_no_expone_datos(): void
    {
        $this->assertSame([], (new TenantSessionRevoked(1))->broadcastWith());
    }
}
