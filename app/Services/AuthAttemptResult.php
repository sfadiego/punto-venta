<?php

namespace App\Services;

use App\Core\Enums\Http;

/**
 * Resultado tipado de AuthService::login() — el login tiene varias razones de rechazo
 * distintas (cuenta inactiva, credenciales, suscripción, cupo de sesiones), cada una con
 * su propio mensaje/código/status, así que se modela como éxito-o-falla en vez de lanzar
 * una excepción por caso.
 */
final class AuthAttemptResult
{
    private function __construct(
        public readonly bool $success,
        public readonly ?array $data = null,
        public readonly ?string $message = null,
        public readonly ?string $code = null,
        public readonly Http $status = Http::UnprocessableEntity,
    ) {}

    public static function ok(array $data): self
    {
        return new self(success: true, data: $data);
    }

    public static function fail(string $message, ?string $code = null, Http $status = Http::UnprocessableEntity): self
    {
        return new self(success: false, message: $message, code: $code, status: $status);
    }
}
