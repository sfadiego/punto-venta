<?php

namespace Tests\Feature;

use App\Models\ErrorReporting;
use Tests\TestCase;

class PruneErrorReportingCommandTest extends TestCase
{
    public function test_comando_elimina_logs_mas_antiguos_que_el_default(): void
    {
        $viejo = ErrorReporting::create([
            'source' => 'backend',
            'endpoint' => '/api/order',
            'method' => 'POST',
            'status_code' => 500,
            'error_message' => 'Error viejo',
            'created_at' => now()->subDays(91),
        ]);

        $reciente = ErrorReporting::create([
            'source' => 'backend',
            'endpoint' => '/api/order',
            'method' => 'POST',
            'status_code' => 500,
            'error_message' => 'Error reciente',
            'created_at' => now()->subDays(10),
        ]);

        $this->artisan('error-reporting:prune')->assertSuccessful();

        $this->assertModelMissing($viejo);
        $this->assertModelExists($reciente);
    }

    public function test_comando_acepta_opcion_days_personalizada(): void
    {
        $log30 = ErrorReporting::create([
            'source' => 'backend',
            'endpoint' => '/api/order',
            'method' => 'POST',
            'status_code' => 500,
            'error_message' => 'Error de hace 31 días',
            'created_at' => now()->subDays(31),
        ]);

        $this->artisan('error-reporting:prune', ['--days' => 30])->assertSuccessful();

        $this->assertModelMissing($log30);
    }

    public function test_comando_sin_logs_antiguos_no_elimina_nada(): void
    {
        $reciente = ErrorReporting::create([
            'source' => 'backend',
            'endpoint' => '/api/order',
            'method' => 'POST',
            'status_code' => 500,
            'error_message' => 'Error reciente',
            'created_at' => now(),
        ]);

        $this->artisan('error-reporting:prune')->assertSuccessful();

        $this->assertModelExists($reciente);
    }
}
