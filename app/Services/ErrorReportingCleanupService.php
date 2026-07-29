<?php

namespace App\Services;

use App\Models\ErrorReporting;
use Illuminate\Support\Carbon;

class ErrorReportingCleanupService
{
    public function pruneOlderThan(int $days): int
    {
        $cutoff = Carbon::now()->subDays($days);
        $deleted = 0;

        do {
            $count = ErrorReporting::where('created_at', '<', $cutoff)->limit(1000)->delete();
            $deleted += $count;
        } while ($count > 0);

        return $deleted;
    }
}
