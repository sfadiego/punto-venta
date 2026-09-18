<?php

namespace Tests\Events;

use App\Events\OrdersUpdated;
use Illuminate\Broadcasting\PrivateChannel;
use Tests\TestCase;

/**
 * OrdersUpdated pasó de un Channel público único ("orders", compartido por TODOS los
 * tenants) a un PrivateChannel por tenant ("orders.{tenantId}") — antes, cualquier negocio
 * conectado veía el "Nuevo pedido recibido" de cualquier otro negocio del mismo servidor.
 *
 * La autorización real de routes/channels.php ("orders.{tenantId}" → compara
 * $user->tenant_id) se prueba end-to-end mejor a nivel HTTP con BROADCAST_CONNECTION=reverb
 * desde el boot de la app (como en producción) — swapear ese config a mitad del proceso de
 * test no migra los canales ya registrados por routes/channels.php contra el driver "log" de
 * phpunit.xml, así que ese camino queda fuera de esta suite por poco confiable. Lo que sí se
 * cubre aquí y en tests/Orders/OrderTest.php:
 * - broadcastOn() arma el canal correcto (este archivo).
 * - el evento lleva el tenant_id correcto del usuario autenticado que lo disparó
 *   (test_crea_orden_dispara_orders_updated_con_tenant_del_usuario_autenticado).
 */
class OrdersUpdatedTest extends TestCase
{
    public function test_broadcast_on_usa_canal_privado_por_tenant(): void
    {
        $event = new OrdersUpdated('created', tenantId: 42);
        $channels = $event->broadcastOn();

        $this->assertCount(1, $channels);
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
        $this->assertSame('private-orders.42', $channels[0]->name);
    }

    public function test_broadcast_on_con_tenant_null_no_produce_canal_generico(): void
    {
        // Si algún call site nuevo olvida pasar el tenant (y app('tenant_id') tampoco está
        // bindeado, ej. un contexto sin usuario autenticado), el canal debe seguir siendo
        // exclusivo de "ningún tenant" (orders.) — nunca debe degradar silenciosamente al
        // viejo canal público "orders" compartido por todos.
        $event = new OrdersUpdated('created');
        $channels = $event->broadcastOn();

        $this->assertSame('private-orders.', $channels[0]->name);
        $this->assertNotSame('orders', $channels[0]->name);
    }
}
