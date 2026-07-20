<?php

namespace App\Console\Commands;

use App\Services\LoginRateLimitService;
use Illuminate\Console\Command;

class AuthUnblockCommand extends Command
{
    protected $signature = 'auth:unblock {email : Email del usuario bloqueado}';

    protected $description = 'Verifica y desbloquea el rate limit de login para un email (todas las IPs registradas)';

    public function handle(LoginRateLimitService $service): int
    {
        $email = strtolower((string) $this->argument('email'));
        $blocked = $service->blockedIpsFor($email);

        if (empty($blocked)) {
            $this->info("No hay bloqueo activo para {$email}.");

            return self::SUCCESS;
        }

        foreach ($blocked as $entry) {
            $this->warn("IP {$entry['ip']}: {$entry['attempts']} intento(s), disponible en {$entry['retry_after']}s.");
        }

        if (! $this->confirm('¿Desbloquear ahora?', true)) {
            return self::SUCCESS;
        }

        $cleared = $service->unblock($email);
        $this->info("Desbloqueado: {$email} ({$cleared} IP(s)).");

        return self::SUCCESS;
    }
}
