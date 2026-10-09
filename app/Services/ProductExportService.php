<?php

namespace App\Services;

use App\Models\ProductModel;
use Generator;

/**
 * Exportación del catálogo de productos a CSV — reporte informativo (código, nombre, precio,
 * categoría, descripción, stock y estado). No es el formato de importación: omite columnas que
 * solo importan al cargar productos (unidad de medida, si maneja stock), así que para importar se
 * usa la plantilla de ProductImportService. Una fila por producto: uno con variantes lleva el
 * stock por variante, así que su columna `stock` sale vacía.
 */
class ProductExportService
{
    // Productos por consulta — el catálogo se recorre en bloques para no cargarlo completo en memoria.
    private const CHUNK_SIZE = 500;

    // Columnas del reporte, en orden: encabezado del CSV => clave de row().
    private const COLUMNS = [
        'codigo' => 'product_code',
        'nombre' => 'nombre',
        'precio' => 'precio',
        'categoria' => 'categoria',
        'descripcion' => 'descripcion',
        'stock' => 'stock',
        'stock_minimo' => 'min_stock',
        'activo' => 'activo',
    ];

    /** @return string[] */
    public function headers(): array
    {
        return array_keys(self::COLUMNS);
    }

    /** @return Generator<int, array<int, string>> */
    public function rows(): Generator
    {
        $products = ProductModel::query()->with('category:id,nombre')->lazyById(self::CHUNK_SIZE);

        foreach ($products as $product) {
            yield $this->row($product);
        }
    }

    /** @return array<int, string> */
    private function row(ProductModel $product): array
    {
        $values = [
            'product_code' => $this->safeText($product->product_code),
            'nombre' => $this->safeText($product->nombre),
            'precio' => number_format((float) $product->precio, 2, '.', ''),
            'categoria' => $this->safeText($product->category?->nombre),
            'descripcion' => $this->safeText($product->descripcion),
            'stock' => $this->number($product->manage_stock ? $product->stock : null),
            'min_stock' => $this->number($product->manage_stock ? $product->min_stock : null),
            'activo' => $this->yesNo($product->activo),
        ];

        // Mismo orden que el encabezado (COLUMNS) — columnas y valores no pueden desalinearse.
        return array_map(fn (string $key): string => $values[$key], array_values(self::COLUMNS));
    }

    private function yesNo(?bool $value): string
    {
        return $value ? 'si' : 'no';
    }

    /** Cantidad sin ceros sobrantes ("10.00" → "10"); vacío si no aplica. */
    private function number(mixed $value): string
    {
        return $value === null ? '' : (string) (float) $value;
    }

    /**
     * Neutraliza la inyección de fórmulas en Excel/Sheets: un texto que empieza con =, +, - o @
     * se ejecutaría como fórmula al abrir el CSV. El apóstrofo inicial lo fuerza a texto plano.
     */
    private function safeText(?string $value): string
    {
        $text = trim((string) $value);

        return $text !== '' && str_contains("=+-@\t\r", $text[0]) ? "'".$text : $text;
    }
}
