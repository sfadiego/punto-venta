<?php

namespace App\Console\Commands;

use App\Services\ErrorReportingCleanupService;
use Illuminate\Console\Command;

class PruneErrorReportingCommand extends Command
{
    protected $signature = 'error-reporting:prune {--days=90 : Días de antigüedad a partir de los cuales se borran los logs}';

    protected $description = 'Elimina los logs de error_reporting más antiguos que N días';

    public function handle(ErrorReportingCleanupService $service): int
    {
        $days = (int) $this->option('days');
        $deleted = $service->pruneOlderThan($days);

        $this->info("Se eliminaron {$deleted} registro(s) de error_reporting anteriores a {$days} días.");

        return self::SUCCESS;
    }
}
