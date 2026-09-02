<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * El negocio no puede recibir pedidos públicos en este momento (menú deshabilitado o sin
 * sesión de caja activa) — ver PublicOrderService::createFromMenu().
 */
class PublicOrderUnavailableException extends RuntimeException {}
