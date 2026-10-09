<?php

namespace App\Services;

use Generator;

/** Reporte exportable de clientes con adeudo: toda la cartera por cobrar, no solo el top 10. */
class DebtorsExportService
{
    public function __construct(private readonly TopDebtorsService $debtors) {}

    /** @return string[] */
    public function headers(): array
    {
        return ['Cliente', 'Teléfono', 'Adeudo', '% de la cartera', 'Último abono', 'Días sin abonar'];
    }

    /** @return Generator<int, array<int, string|int|float|null>> */
    public function rows(): Generator
    {
        foreach ($this->debtors->allRows() as $debtor) {
            yield [
                $debtor['name'],
                $debtor['phone'],
                $debtor['balance'],
                $debtor['share_percent'],
                $debtor['last_payment_at'] ? substr((string) $debtor['last_payment_at'], 0, 10) : 'Nunca',
                $debtor['days_without_payment'],
            ];
        }
    }
}
