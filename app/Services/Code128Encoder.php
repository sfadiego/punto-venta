<?php

namespace App\Services;

use Picqer\Barcode\Barcode;
use Picqer\Barcode\Exceptions\InvalidCharacterException;
use Picqer\Barcode\Types\TypeCode128;

/**
 * Único punto donde se codifica un valor en Code128 (catálogo en PDF e imagen individual).
 * picqer no rechaza caracteres fuera de ASCII: un código con acentos o ñ (ej. "CÓDIGO") produce
 * unas barras que un lector no leería como ese texto. Por eso solo se aceptan caracteres ASCII
 * imprimibles (letras sin acento, números y símbolos comunes) y el resto se rechaza antes de dibujar.
 */
class Code128Encoder
{
    /**
     * @throws InvalidCharacterException si el valor está vacío o tiene caracteres fuera de ASCII imprimible.
     */
    public function encode(string $code): Barcode
    {
        if (! $this->isEncodable($code)) {
            throw new InvalidCharacterException('El código solo admite caracteres ASCII imprimibles.');
        }

        return (new TypeCode128)->getBarcode($code);
    }

    public function isEncodable(string $code): bool
    {
        return preg_match('/^[\x20-\x7E]+$/', $code) === 1;
    }
}
