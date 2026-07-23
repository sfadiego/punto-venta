<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Rejects digit strings with no real variety: all-same ("0000000000"),
 * strictly sequential — cyclic, so "1234567890" (wraps 9→0) counts the same
 * as "0123456789" — or a short unit repeated to fill the length
 * ("123123123123"). Mirrors resources/js/utils/phoneUtils.ts's hasLowEntropy,
 * since frontend validation alone doesn't protect this public endpoint.
 */
class PlausiblePhoneRule implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $digits = ltrim((string) $value, '+');

        if ($this->hasLowEntropy($digits)) {
            $fail('El :attribute no parece ser un número válido.');
        }
    }

    private function hasLowEntropy(string $digits): bool
    {
        if (preg_match('/^(\d)\1+$/', $digits)) {
            return true;
        }

        $length = strlen($digits);
        $isSequential = true;
        $isReverseSequential = true;

        for ($i = 1; $i < $length; $i++) {
            $diff = ((int) $digits[$i] - (int) $digits[$i - 1] + 10) % 10;
            $reverseDiff = ((int) $digits[$i - 1] - (int) $digits[$i] + 10) % 10;

            if ($diff !== 1) {
                $isSequential = false;
            }
            if ($reverseDiff !== 1) {
                $isReverseSequential = false;
            }
        }

        if ($isSequential || $isReverseSequential) {
            return true;
        }

        for ($period = 1; $period <= intdiv($length, 2); $period++) {
            if ($length % $period !== 0) {
                continue;
            }
            $unit = substr($digits, 0, $period);
            if (str_repeat($unit, intdiv($length, $period)) === $digits) {
                return true;
            }
        }

        return false;
    }
}
