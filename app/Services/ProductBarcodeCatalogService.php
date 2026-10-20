<?php

namespace App\Services;

use App\Models\CategoryModel;
use App\Models\ProductModel;
use FPDF;
use Generator;
use Picqer\Barcode\Exceptions\BarcodeException;

/**
 * Catálogo de productos en PDF — exclusivo de negocios retail. Cada fila lleva solo lo básico:
 * código, nombre, precio y categoría (sin iconos ni imágenes). Con `$includeBarcode` el código se
 * dibuja como código de barras (Code128); sin él, el catálogo es una lista simple con el código
 * como texto. Se dibuja con FPDF (barras como rectángulos vectoriales, sin maquetar HTML) y las
 * barras las calcula picqer/php-barcode-generator: DomPDF tardaba ~58 s y ~750 MB con 5,000
 * productos, esto tarda menos de 1 s con 5,000. Un producto sin `product_code` usa su id como
 * código; el id solo se imprime en el PDF, no se guarda.
 */
class ProductBarcodeCatalogService
{
    public function __construct(private readonly Code128Encoder $encoder) {}

    // Tope de productos por PDF — generoso a propósito (medido: 20,000 productos ≈ 1 s y 37 MB),
    // solo evita que un catálogo desmedido tumbe el proceso. Mismo patrón que SalesReportExportService.
    public const MAX_ROWS = 10000;

    // Código que no se puede dibujar en Code128 (ej. caracteres fuera de ASCII capturados a mano):
    // el producto igual aparece en el catálogo, sin barras.
    private const INVALID_CODE_LABEL = 'Código no válido para Code128';

    // Maqueta en milímetros (A4 vertical).
    private const MARGIN_X = 10;

    private const PRICE_X = 175;

    private const PRICE_WIDTH = 25;

    // Con código de barras: una fila alta por producto.
    private const ROW_HEIGHT = 12;

    private const ROWS_PER_PAGE = 22;

    private const FIRST_ROW_Y = 22;

    private const BARCODE_HEIGHT = 7;

    // Ancho de cada módulo (la barra más fina). 0.4 mm es cómodo para un lector de mostrador; un
    // código muy largo se comprime al ancho máximo de la columna en vez de salirse de la página.
    private const MODULE_WIDTH = 0.4;

    private const BARCODE_MAX_WIDTH = 85;

    private const NAME_X = 100;

    private const NAME_MAX_CHARS = 42;

    // Sin código de barras: lista compacta con encabezado de columnas (código | producto | categoría | precio).
    private const LIST_ROW_HEIGHT = 8;

    private const LIST_ROWS_PER_PAGE = 30;

    private const LIST_FIRST_ROW_Y = 29;

    private const LIST_HEADER_Y = 22;

    private const LIST_CODE_X = 10;

    private const LIST_CODE_WIDTH = 38;

    private const LIST_CODE_MAX_CHARS = 22;

    private const LIST_NAME_X = 50;

    private const LIST_NAME_WIDTH = 70;

    private const LIST_NAME_MAX_CHARS = 40;

    private const LIST_CATEGORY_X = 122;

    private const LIST_CATEGORY_WIDTH = 50;

    private const LIST_CATEGORY_MAX_CHARS = 28;

    /** Chequea MAX_ROWS con un COUNT barato, antes de dibujar el PDF. */
    public function exceedsRowLimit(): bool
    {
        return ProductModel::query()->count() > self::MAX_ROWS;
    }

    /**
     * Filas del catálogo, ordenadas por nombre. Solo selecciona las columnas necesarias.
     *
     * @return Generator<int, array{code: string, name: string, price: float, category: string}>
     */
    public function rows(): Generator
    {
        // cursor() no hace eager loading: las categorías se cargan una sola vez (ya filtradas por
        // tenant) en vez de una consulta por producto.
        $categoryNames = CategoryModel::query()->pluck(CategoryModel::NOMBRE, 'id');

        $products = ProductModel::query()
            ->select(['id', ProductModel::NOMBRE, ProductModel::PRECIO, ProductModel::PRODUCT_CODE, ProductModel::CATEGORIA_ID])
            ->orderBy(ProductModel::NOMBRE)
            ->orderBy('id')
            ->cursor();

        foreach ($products as $product) {
            yield [
                'code' => $product->barcodeValue(),
                'name' => (string) $product->nombre,
                'price' => (float) $product->precio,
                'category' => (string) ($categoryNames[$product->categoria_id] ?? ''),
            ];
        }
    }

    public function buildPdf(bool $includeBarcode = true): string
    {
        $pdf = new FPDF('P', 'mm', 'A4');
        $pdf->SetAutoPageBreak(false);
        $pdf->SetMargins(self::MARGIN_X, self::MARGIN_X);

        $rowHeight = $includeBarcode ? self::ROW_HEIGHT : self::LIST_ROW_HEIGHT;
        $rowsPerPage = $includeBarcode ? self::ROWS_PER_PAGE : self::LIST_ROWS_PER_PAGE;
        $firstRowY = $includeBarcode ? self::FIRST_ROW_Y : self::LIST_FIRST_ROW_Y;

        $index = 0;
        foreach ($this->rows() as $row) {
            $position = $index % $rowsPerPage;
            if ($position === 0) {
                $this->startPage($pdf, $includeBarcode);
            }

            $y = $firstRowY + $position * $rowHeight;
            if ($includeBarcode) {
                $this->drawBarcodeRow($pdf, $row, $y);
            } else {
                $this->drawListRow($pdf, $row, $y);
            }
            $index++;
        }

        if ($index === 0) {
            $this->startPage($pdf, $includeBarcode);
            $pdf->SetFont('Helvetica', '', 10);
            $pdf->SetXY(self::MARGIN_X, $firstRowY);
            $pdf->Cell(0, 6, $this->pdfText('No hay productos registrados.'));
        }

        return $pdf->Output('S');
    }

    private function startPage(FPDF $pdf, bool $includeBarcode): void
    {
        $pdf->AddPage();
        $pdf->SetFont('Helvetica', 'B', 12);
        $pdf->SetXY(self::MARGIN_X, self::MARGIN_X);
        $pdf->Cell(0, 6, $this->pdfText($includeBarcode ? 'Catálogo de productos con código de barras' : 'Catálogo de productos'));
        $pdf->SetFont('Helvetica', '', 8);
        $pdf->SetXY(self::MARGIN_X, self::MARGIN_X + 6);
        $pdf->Cell(0, 4, $this->pdfText('Generado el '.now()->format('d/m/Y H:i')));

        if (! $includeBarcode) {
            $this->drawListHeader($pdf);
        }
    }

    private function drawListHeader(FPDF $pdf): void
    {
        $pdf->SetFont('Helvetica', 'B', 8);
        $pdf->SetXY(self::LIST_CODE_X, self::LIST_HEADER_Y);
        $pdf->Cell(self::LIST_CODE_WIDTH, 5, $this->pdfText('Código'));
        $pdf->SetXY(self::LIST_NAME_X, self::LIST_HEADER_Y);
        $pdf->Cell(self::LIST_NAME_WIDTH, 5, $this->pdfText('Producto'));
        $pdf->SetXY(self::LIST_CATEGORY_X, self::LIST_HEADER_Y);
        $pdf->Cell(self::LIST_CATEGORY_WIDTH, 5, $this->pdfText('Categoría'));
        $pdf->SetXY(self::PRICE_X, self::LIST_HEADER_Y);
        $pdf->Cell(self::PRICE_WIDTH, 5, $this->pdfText('Precio'), 0, 0, 'R');
        $pdf->SetDrawColor(120);
        $pdf->Line(self::MARGIN_X, self::LIST_HEADER_Y + 5.5, self::PRICE_X + self::PRICE_WIDTH, self::LIST_HEADER_Y + 5.5);
    }

    /** @param array{code: string, name: string, price: float, category: string} $row */
    private function drawListRow(FPDF $pdf, array $row, float $y): void
    {
        $pdf->SetFont('Helvetica', '', 8);

        $pdf->SetXY(self::LIST_CODE_X, $y);
        $pdf->Cell(self::LIST_CODE_WIDTH, 5, $this->pdfText(mb_strimwidth($row['code'], 0, self::LIST_CODE_MAX_CHARS, '...')));

        $pdf->SetXY(self::LIST_NAME_X, $y);
        $pdf->Cell(self::LIST_NAME_WIDTH, 5, $this->pdfText(mb_strimwidth($row['name'], 0, self::LIST_NAME_MAX_CHARS, '...')));

        $pdf->SetTextColor(120);
        $pdf->SetXY(self::LIST_CATEGORY_X, $y);
        $pdf->Cell(self::LIST_CATEGORY_WIDTH, 5, $this->pdfText(mb_strimwidth($row['category'], 0, self::LIST_CATEGORY_MAX_CHARS, '...')));
        $pdf->SetTextColor(0);

        $pdf->SetXY(self::PRICE_X, $y);
        $pdf->Cell(self::PRICE_WIDTH, 5, '$'.number_format($row['price'], 2), 0, 0, 'R');

        // Línea tenue entre filas para que la lista se lea de corrido.
        $pdf->SetDrawColor(225);
        $pdf->Line(self::MARGIN_X, $y + 6.5, self::PRICE_X + self::PRICE_WIDTH, $y + 6.5);
    }

    /** @param array{code: string, name: string, price: float, category: string} $row */
    private function drawBarcodeRow(FPDF $pdf, array $row, float $y): void
    {
        $pdf->SetFont('Helvetica', '', 8);

        if (! $this->drawBarcode($pdf, $row['code'], $y)) {
            $pdf->SetXY(self::MARGIN_X, $y + 2);
            $pdf->Cell(self::BARCODE_MAX_WIDTH, 4, $this->pdfText(self::INVALID_CODE_LABEL));
        }

        $pdf->SetXY(self::MARGIN_X, $y + self::BARCODE_HEIGHT);
        $pdf->Cell(self::BARCODE_MAX_WIDTH, 4, $this->pdfText($row['code']));

        $pdf->SetXY(self::NAME_X, $y + 1);
        $pdf->Cell(self::PRICE_X - self::NAME_X, 5, $this->pdfText(mb_strimwidth($row['name'], 0, self::NAME_MAX_CHARS, '...')));

        // Categoría debajo del nombre, en gris y más chica, para que el nombre siga siendo lo primero que se lee.
        $pdf->SetFont('Helvetica', '', 7);
        $pdf->SetTextColor(120);
        $pdf->SetXY(self::NAME_X, $y + 6);
        $pdf->Cell(self::PRICE_X - self::NAME_X, 4, $this->pdfText(mb_strimwidth($row['category'], 0, self::NAME_MAX_CHARS, '...')));
        $pdf->SetTextColor(0);
        $pdf->SetFont('Helvetica', '', 8);

        $pdf->SetXY(self::PRICE_X, $y + 1);
        $pdf->Cell(self::PRICE_WIDTH, 5, '$'.number_format($row['price'], 2), 0, 0, 'R');
    }

    /** Dibuja las barras; false si el código no se puede codificar (la fila sigue sin barras). */
    private function drawBarcode(FPDF $pdf, string $code, float $y): bool
    {
        try {
            $barcode = $this->encoder->encode($code);
        } catch (BarcodeException) {
            return false;
        }

        $scale = min(self::MODULE_WIDTH, self::BARCODE_MAX_WIDTH / $barcode->getWidth());
        $pdf->SetFillColor(0);
        $x = self::MARGIN_X;
        foreach ($barcode->getBars() as $bar) {
            $width = $bar->getWidth() * $scale;
            if ($bar->isBar()) {
                $pdf->Rect($x, $y, $width, self::BARCODE_HEIGHT, 'F');
            }
            $x += $width;
        }

        return true;
    }

    /** FPDF con fuentes base solo entiende Windows-1252: acentos y ñ salen bien, lo demás se vuelve "?". */
    private function pdfText(string $text): string
    {
        return mb_convert_encoding($text, 'Windows-1252', 'UTF-8');
    }
}
