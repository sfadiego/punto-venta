<?php

namespace App\Rules;

use App\Services\Code128Encoder;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * El código de barras del producto solo admite lo que el generador de Code128 puede dibujar:
 * ASCII imprimible (letras sin acento, números y símbolos comunes). Usa Code128Encoder, la misma
 * definición del catálogo en PDF y de la imagen individual, para que no puedan desincronizarse.
 * Como todo ValidationRule no implícito, no se ejecuta con un valor vacío (el código es opcional).
 */
class Code128Compatible implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! app(Code128Encoder::class)->isEncodable((string) $value)) {
            $fail('El código de barras solo admite letras sin acento, números y símbolos comunes (sin acentos, ñ ni emojis).');
        }
    }
}
