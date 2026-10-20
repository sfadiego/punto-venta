<?php

namespace App\Services;

use Picqer\Barcode\Exceptions\BarcodeException;

/**
 * Imagen PNG del código de barras (Code128) de un producto: las barras con su margen en blanco y
 * el código escrito debajo. Las barras las calcula picqer/php-barcode-generator (igual que el
 * catálogo en PDF, ProductBarcodeCatalogService) y se dibujan con GD.
 */
class ProductBarcodeImageService
{
    public function __construct(private readonly Code128Encoder $encoder) {}

    // Tamaños en píxeles: un código típico queda de ~500 px de ancho, suficiente para imprimirlo
    // o meterlo en un programa de etiquetas sin que se vea borroso.
    private const MODULE_WIDTH = 3;

    private const BAR_HEIGHT = 100;

    // Code128 pide un margen en blanco de al menos 10 módulos a cada lado para que el lector
    // distinga dónde empieza y termina el código.
    private const QUIET_ZONE_MODULES = 10;

    private const PADDING_TOP = 10;

    private const TEXT_GAP = 8;

    private const PADDING_BOTTOM = 8;

    // Fuente incorporada de GD (no necesita archivos .ttf): el código de Code128 es solo ASCII.
    private const FONT = 4;

    /**
     * @throws BarcodeException si el código no se puede codificar en Code128 (ej. acentos, ñ u otros caracteres fuera de ASCII).
     */
    public function png(string $code): string
    {
        $barcode = $this->encoder->encode($code);

        $quietZone = self::QUIET_ZONE_MODULES * self::MODULE_WIDTH;
        $barsWidth = $barcode->getWidth() * self::MODULE_WIDTH;
        $textWidth = imagefontwidth(self::FONT) * strlen($code);
        $canvasWidth = max($barsWidth, $textWidth) + 2 * $quietZone;
        $canvasHeight = self::PADDING_TOP + self::BAR_HEIGHT + self::TEXT_GAP + imagefontheight(self::FONT) + self::PADDING_BOTTOM;

        $image = imagecreatetruecolor($canvasWidth, $canvasHeight);
        $white = imagecolorallocate($image, 255, 255, 255);
        $black = imagecolorallocate($image, 0, 0, 0);
        imagefill($image, 0, 0, $white);

        $x = intdiv($canvasWidth - $barsWidth, 2);
        foreach ($barcode->getBars() as $bar) {
            $width = $bar->getWidth() * self::MODULE_WIDTH;
            if ($bar->isBar()) {
                imagefilledrectangle($image, $x, self::PADDING_TOP, $x + $width - 1, self::PADDING_TOP + self::BAR_HEIGHT - 1, $black);
            }
            $x += $width;
        }

        imagestring(
            $image,
            self::FONT,
            intdiv($canvasWidth - $textWidth, 2),
            self::PADDING_TOP + self::BAR_HEIGHT + self::TEXT_GAP,
            $code,
            $black,
        );

        ob_start();
        imagepng($image);

        return (string) ob_get_clean();
    }
}
