<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Canal privado de eventos de órdenes (OrdersUpdated) — un tenant nunca debe recibir los
// eventos de otro. Antes era un Channel público sin tenant en el nombre, así que cualquier
// negocio conectado veía "Nuevo pedido recibido" de TODOS los demás negocios del servidor.
Broadcast::channel('orders.{tenantId}', function ($user, $tenantId) {
    return (int) $user->tenant_id === (int) $tenantId;
});
