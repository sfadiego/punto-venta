<?php

namespace Tests\Catalog;

use App\Services\Code128Encoder;
use PHPUnit\Framework\Attributes\DataProvider;
use Picqer\Barcode\Exceptions\InvalidCharacterException;
use Tests\TestCase;

/**
 * picqer no rechaza caracteres fuera de ASCII (codifica sus bytes y produce barras que no leen como
 * el texto impreso): Code128Encoder es el filtro que lo evita.
 */
class Code128EncoderTest extends TestCase
{
    /** @return array<string, array{string}> */
    public static function codigosValidos(): array
    {
        return [
            'letras y números' => ['PRD001'],
            'solo números (id del producto)' => ['15'],
            'con espacios y símbolos' => ['AB-12 x_/y.#'],
            'minúsculas' => ['juguete01'],
            'longitud máxima del campo' => [str_repeat('A', 64)],
        ];
    }

    /** @return array<string, array{string}> */
    public static function codigosInvalidos(): array
    {
        return [
            'acento' => ['CÓDIGO'],
            'eñe' => ['ñandú'],
            'emoji' => ['PRD🎉'],
            'carácter de control' => ["AB\tC"],
            'byte fuera de ASCII' => ["A\x80B"],
            'vacío' => [''],
        ];
    }

    #[DataProvider('codigosValidos')]
    public function test_codigo_ascii_imprimible_se_codifica(string $code): void
    {
        $encoder = new Code128Encoder;

        $this->assertTrue($encoder->isEncodable($code));
        $this->assertGreaterThan(0, $encoder->encode($code)->getWidth());
    }

    #[DataProvider('codigosInvalidos')]
    public function test_codigo_fuera_de_ascii_imprimible_se_rechaza(string $code): void
    {
        $encoder = new Code128Encoder;

        $this->assertFalse($encoder->isEncodable($code));
        $this->expectException(InvalidCharacterException::class);
        $encoder->encode($code);
    }
}
