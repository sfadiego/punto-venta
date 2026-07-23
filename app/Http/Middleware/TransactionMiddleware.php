<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class TransactionMiddleware
{
    private const MAX_ATTEMPTS = 3;

    /**
     * @throws Throwable
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('get') || app()->runningUnitTests()) {
            return $next($request);
        }

        $attempts = 0;

        while (true) {
            $attempts++;
            DB::beginTransaction();

            try {
                /** @var Response $response */
                $response = $next($request);

                if ($response instanceof JsonResponse) {
                    if ($response->getStatusCode() === 500) {
                        DB::rollBack();

                        return $response;
                    }

                    $data = $response->getData(true);
                    if (isset($data['status']) && $data['status'] === 'error') {
                        DB::rollBack();

                        return $response;
                    }
                }

                DB::commit();

                return $response;
            } catch (Throwable $e) {
                DB::rollBack();

                if ($attempts < self::MAX_ATTEMPTS && $this->isDeadlock($e)) {
                    continue;
                }

                throw $e;
            }
        }
    }

    private function isDeadlock(Throwable $e): bool
    {
        $codes = [
            1213, // Deadlock found when trying to get lock
            1205, // Lock wait timeout exceeded
        ];

        $prev = $e->getPrevious();
        if ($prev instanceof \PDOException && in_array($prev->errorInfo[1] ?? null, $codes)) {
            return true;
        }

        if ($e instanceof \PDOException && in_array($e->errorInfo[1] ?? null, $codes)) {
            return true;
        }

        return str_contains($e->getMessage(), 'Deadlock') || str_contains($e->getMessage(), '1213');
    }
}
