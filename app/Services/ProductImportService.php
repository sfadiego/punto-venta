<?php

namespace App\Services;

use App\Enums\StockMovementReasonEnum;
use App\Enums\UnidadMedidaEnum;
use App\Exceptions\InsufficientStockException;
use App\Models\CategoryModel;
use App\Models\ProductModel;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Importación masiva de productos desde CSV (módulo de Inventario, exclusivo retail —
 * ver RetailStockMiddleware). Flujo de dos pasos: preview() (Fase 1, no escribe nada) →
 * commit() (Fase 2, aplica lo que preview() ya reportó). Ambos comparten resolveRow(), así
 * que lo que el usuario ve en la vista previa es exactamente lo que se aplicaría al confirmar.
 */
class ProductImportService
{
    public function __construct(private readonly StockService $stockService) {}

    // Encabezados esperados del CSV (columna → clave interna). Cualquier columna fuera de
    // este mapa se ignora — así el usuario puede dejar columnas extra sin que truene.
    private const HEADER_MAP = [
        'codigo' => 'product_code',
        'nombre' => 'nombre',
        'precio' => 'precio',
        'categoria' => 'categoria',
        'descripcion' => 'descripcion',
        'unidad_medida' => 'unidad_medida',
        'maneja_stock' => 'manage_stock',
        'stock' => 'stock',
        'stock_minimo' => 'min_stock',
        'activo' => 'activo',
    ];

    // Distancia de edición máxima (Levenshtein, sin librería nueva) para sospechar un typo
    // en vez de tratar el nombre de categoría como genuinamente nuevo — evita crear
    // categorías basura por errores de tipeo, sin bloquear nombres legítimamente distintos.
    // Ambas condiciones deben cumplirse: distancia absoluta baja Y relativa al largo del
    // nombre (para que nombres cortos no disparen falsos positivos con cualquier vecino).
    private const TYPO_MAX_DISTANCE = 2;

    private const TYPO_MAX_RATIO = 0.34;

    /** @var array<string,int> nombre de categoría normalizado (minúsculas) => id, precargado una sola vez. */
    private array $existingCategoriesByName = [];

    /** @var array<string,string> nombre normalizado => nombre original (capitalización real), para
     *  mostrar la sugerencia de typo con el nombre tal como está guardado, no en minúsculas. */
    private array $existingCategoryOriginalCase = [];

    /** @var array<string,true> nombres de categoría nuevos ya detectados en ESTE archivo — evita
     *  marcar la misma categoría nueva como "se creará" en cada fila que la repite. */
    private array $newCategoriesInFile = [];

    /** @var array<string,int> nombre normalizado => id, categorías creadas DURANTE este commit —
     *  para que dos filas que comparten una categoría nueva no la creen dos veces. */
    private array $createdCategoriesInRun = [];

    public function preview(UploadedFile $file): array
    {
        return $this->run($file, dryRun: true);
    }

    /**
     * commit — aplica lo mismo que preview() ya reportó. Cada fila se procesa de forma
     * independiente: si una lanza una excepción inesperada, se registra como error de ESA
     * fila y el resto sigue — nunca se deja escapar la excepción hacia arriba, porque
     * TransactionMiddleware envuelve toda la request en una sola transacción y eso
     * revertiría también las filas ya guardadas exitosamente.
     */
    public function commit(UploadedFile $file, ?int $createdBy): array
    {
        return $this->run($file, dryRun: false, createdBy: $createdBy);
    }

    private function run(UploadedFile $file, bool $dryRun, ?int $createdBy = null): array
    {
        $rows = $this->parseCsv($file);
        $this->preloadCategories();
        $existingProductsByCode = $this->preloadProductsByCode($rows);
        $existingProductNames = $this->preloadProductNames();

        $report = [];
        foreach ($rows as $index => $row) {
            $resolved = $this->resolveRow($row, $index + 2, $existingProductsByCode, $existingProductNames);

            if (! $dryRun && $resolved['action'] !== 'error') {
                $resolved = $this->applyRow($resolved, $createdBy);
            }

            $report[] = $resolved;
        }

        return [
            'summary' => $this->buildSummary($report),
            'rows' => $report,
        ];
    }

    // Columnas de HEADER_MAP que se omiten en la plantilla descargable porque su ausencia ya
    // tiene un default sensato (activo => true) — el import las sigue aceptando si el usuario
    // las agrega a mano a un archivo existente.
    private const TEMPLATE_SKIP_COLUMNS = ['activo'];

    /** Filas de ejemplo para la plantilla descargable — encabezado real + una fila de muestra. */
    public function templateRows(): array
    {
        $sample = ['', 'Playera básica', '199.00', 'Ropa', 'Playera de algodón', 'unidad', 'si', '10', '2', 'si'];
        $columns = array_keys(self::HEADER_MAP);

        $keptIndexes = array_keys(array_diff($columns, self::TEMPLATE_SKIP_COLUMNS));

        return [
            array_values(array_intersect_key($columns, array_flip($keptIndexes))),
            array_values(array_intersect_key($sample, array_flip($keptIndexes))),
        ];
    }

    private function parseCsv(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        $headerLine = fgetcsv($handle) ?: [];
        // BOM de Excel en la primera celda del encabezado (guardado como "UTF-8 CSV").
        if (isset($headerLine[0])) {
            $headerLine[0] = preg_replace('/^\xEF\xBB\xBF/', '', $headerLine[0]);
        }
        $header = array_map(fn ($h) => mb_strtolower(trim((string) $h)), $headerLine);

        $rows = [];
        while (($line = fgetcsv($handle)) !== false) {
            $isEmpty = count(array_filter($line, fn ($v) => trim((string) $v) !== '')) === 0;
            if ($isEmpty) {
                continue;
            }

            $row = [];
            foreach ($header as $i => $key) {
                $mapped = self::HEADER_MAP[$key] ?? null;
                if ($mapped !== null) {
                    $row[$mapped] = trim((string) ($line[$i] ?? ''));
                }
            }
            $rows[] = $row;
        }
        fclose($handle);

        return $rows;
    }

    private function preloadCategories(): void
    {
        $categories = CategoryModel::all([CategoryModel::NOMBRE, 'id']);

        $this->existingCategoriesByName = $categories
            ->mapWithKeys(fn (CategoryModel $c) => [mb_strtolower($c->nombre) => $c->id])
            ->all();
        $this->existingCategoryOriginalCase = $categories
            ->mapWithKeys(fn (CategoryModel $c) => [mb_strtolower($c->nombre) => $c->nombre])
            ->all();
    }

    private function preloadProductsByCode(array $rows): Collection
    {
        $codes = collect($rows)->pluck('product_code')->filter()->unique()->values();

        if ($codes->isEmpty()) {
            return collect();
        }

        return ProductModel::whereIn(ProductModel::PRODUCT_CODE, $codes)->get()
            ->keyBy(fn (ProductModel $p) => mb_strtolower($p->product_code));
    }

    /** @return string[] nombres de producto existentes, normalizados — para detectar choques de nombre. */
    private function preloadProductNames(): array
    {
        return ProductModel::pluck(ProductModel::NOMBRE)->map(fn ($n) => mb_strtolower($n))->all();
    }

    private function resolveRow(array $row, int $lineNumber, Collection $existingProductsByCode, array $existingProductNamesLower): array
    {
        $errors = [];
        $warnings = [];

        $nombre = $row['nombre'] ?? '';
        if ($nombre === '') {
            return $this->buildRowResult($lineNumber, ['Falta el nombre del producto.'], []);
        }

        $precioRaw = $row['precio'] ?? '';
        $precio = is_numeric($precioRaw) ? (float) $precioRaw : null;
        if ($precio === null || $precio < 0) {
            $warnings[] = 'Precio inválido, se usará 0.';
            $precio = 0.0;
        }

        $productCode = ($row['product_code'] ?? '') !== '' ? $row['product_code'] : null;
        $existingProduct = $productCode ? $existingProductsByCode->get(mb_strtolower($productCode)) : null;

        if (! $existingProduct && in_array(mb_strtolower($nombre), $existingProductNamesLower, true)) {
            $errors[] = 'Ya existe un producto con este nombre. Agrega su código para actualizarlo, o usa un nombre distinto.';

            return $this->buildRowResult($lineNumber, $errors, $warnings);
        }

        $categoriaNombre = $row['categoria'] ?? '';
        if ($categoriaNombre === '') {
            return $this->buildRowResult($lineNumber, ['Falta la categoría.'], $warnings);
        }

        $categoria = $this->resolveCategory($categoriaNombre);
        if ($categoria['status'] === 'ambiguous') {
            $errors[] = "La categoría \"{$categoriaNombre}\" es muy parecida a \"{$categoria['suggestion']}\" ya existente — revisa si es un error de tipeo antes de continuar.";

            return $this->buildRowResult($lineNumber, $errors, $warnings);
        }
        if ($categoria['status'] === 'new') {
            $warnings[] = "La categoría \"{$categoriaNombre}\" no existe, se creará.";
        }

        if (! $existingProduct && ! $productCode) {
            $productCode = ProductModel::generateProductCode($nombre);
        }

        [$unidad, $unidadWarning] = $this->resolveUnidadMedida($row['unidad_medida'] ?? '');
        if ($unidadWarning !== null) {
            $warnings[] = $unidadWarning;
        }

        // Al actualizar, si la celda viene vacía se conserva el manage_stock actual del
        // producto (no se asume false) — dejar la columna en blanco para "no tocar este
        // campo" no debe desactivar el control de stock ni borrar su stock/mínimo actuales.
        [$manageStock, $manageStockWarning] = $this->resolveBool(
            $row['manage_stock'] ?? '',
            label: 'Maneja stock',
            default: $existingProduct?->manage_stock ?? false,
        );
        if ($manageStockWarning !== null) {
            $warnings[] = $manageStockWarning;
        }

        [$stock, $stockWarning] = $this->resolveNumericField($row['stock'] ?? '', label: 'Stock');
        if ($stockWarning !== null) {
            $warnings[] = $stockWarning;
        }

        [$minStock, $minStockWarning] = $this->resolveNumericField($row['min_stock'] ?? '', label: 'Stock mínimo');
        if ($minStockWarning !== null) {
            $warnings[] = $minStockWarning;
        }

        [$activo, $activoWarning] = $this->resolveBool($row['activo'] ?? '', label: 'Activo', default: true);
        if ($activoWarning !== null) {
            $warnings[] = $activoWarning;
        }

        return $this->buildRowResult($lineNumber, $errors, $warnings, [
            'action' => $existingProduct ? 'update' : 'create',
            'existing_product_id' => $existingProduct?->id,
            'product_code' => $productCode,
            'nombre' => $nombre,
            'precio' => $precio,
            'categoria' => $categoriaNombre,
            'categoria_status' => $categoria['status'],
            'categoria_id' => $categoria['id'] ?? null,
            'descripcion' => $row['descripcion'] ?? '',
            'unidad_medida' => $unidad->value,
            'manage_stock' => $manageStock,
            'stock' => $stock,
            'min_stock' => $minStock,
            'activo' => $activo,
        ]);
    }

    /**
     * Resuelve el nombre de categoría contra las ya existentes del tenant y las nuevas ya
     * detectadas en este mismo archivo:
     * - "existing": coincidencia exacta (sin distinguir mayúsculas/acentos de capitalización).
     * - "new": no hay coincidencia cercana — se creará (o ya se marcó para crear en una fila anterior).
     * - "ambiguous": hay una categoría existente muy parecida — posible typo, no se crea nada
     *   hasta que el usuario confirme corrigiendo el archivo.
     */
    private function resolveCategory(string $nombre): array
    {
        $key = mb_strtolower($nombre);

        if (isset($this->existingCategoriesByName[$key])) {
            return ['status' => 'existing', 'id' => $this->existingCategoriesByName[$key]];
        }

        if (isset($this->newCategoriesInFile[$key])) {
            return ['status' => 'new'];
        }

        $closest = null;
        $closestDistance = null;
        foreach (array_keys($this->existingCategoriesByName) as $existingName) {
            $distance = levenshtein($key, $existingName);
            $ratio = $distance / max(mb_strlen($key), mb_strlen($existingName));

            if ($distance > 0 && $distance <= self::TYPO_MAX_DISTANCE && $ratio <= self::TYPO_MAX_RATIO) {
                if ($closestDistance === null || $distance < $closestDistance) {
                    $closest = $existingName;
                    $closestDistance = $distance;
                }
            }
        }

        if ($closest !== null) {
            return ['status' => 'ambiguous', 'suggestion' => $this->existingCategoryOriginalCase[$closest] ?? $closest];
        }

        $this->newCategoriesInFile[$key] = true;

        return ['status' => 'new'];
    }

    /**
     * Escribe en base de datos lo que resolveRow() ya validó para esta fila — crea la
     * categoría nueva si aplica, crea o actualiza el producto por los mismos paths que usa
     * el formulario individual (nunca un ->update() crudo), y aplica stock exclusivamente
     * vía StockService (nunca escribe la columna directo).
     */
    private function applyRow(array $resolved, ?int $createdBy): array
    {
        $data = $resolved['data'];

        try {
            $categoriaId = $data['categoria_status'] === 'new'
                ? $this->getOrCreateCategoryId($data['categoria'])
                : $data['categoria_id'];

            if ($data['action'] === 'create') {
                $product = ProductModel::create([
                    ProductModel::NOMBRE => $data['nombre'],
                    ProductModel::PRECIO => $data['precio'],
                    ProductModel::DESCRIPCION => $data['descripcion'],
                    ProductModel::CATEGORIA_ID => $categoriaId,
                    ProductModel::UNIDAD_MEDIDA => $data['unidad_medida'],
                    ProductModel::MANAGE_STOCK => $data['manage_stock'],
                    ProductModel::STOCK => $data['manage_stock'] ? 0 : null,
                    ProductModel::MIN_STOCK => $data['manage_stock']
                        ? ($data['min_stock'] ?? ProductModel::MIN_STOCK_DEFAULT)
                        : null,
                    ProductModel::PRODUCT_CODE => $data['product_code'],
                    ProductModel::ACTIVO => $data['activo'],
                ]);

                // igual que ProductController::store(): la existencia inicial se registra
                // como movimiento auditado, nunca como valor directo del INSERT.
                $initialStock = (float) ($data['stock'] ?? 0);
                if ($data['manage_stock'] && $initialStock > 0) {
                    $this->stockService->adjust(
                        productId: $product->id,
                        delta: $initialStock,
                        note: 'Importación masiva',
                        createdBy: $createdBy,
                        reason: StockMovementReasonEnum::InitialStock,
                    );
                }

                $resolved['data']['product_id'] = $product->id;
            } else {
                /** @var ProductModel $product */
                $product = ProductModel::findOrFail($data['existing_product_id']);

                $product->updateProduct(
                    nombre: $data['nombre'],
                    precio: $data['precio'],
                    descripcion: $data['descripcion'],
                    categoriaId: $categoriaId,
                    pictureId: null,
                    active: $data['activo'],
                    unidadMedida: $data['unidad_medida'],
                    manageStock: $data['manage_stock'],
                    minStock: $data['min_stock'],
                    productCode: $data['product_code'],
                );

                // el CSV expresa el stock deseado (no un delta) — se calcula la diferencia
                // contra el stock actual y se aplica como un único ajuste auditado.
                if ($data['manage_stock'] && $data['stock'] !== null) {
                    $delta = $data['stock'] - (float) ($product->fresh()->stock ?? 0);
                    if (abs($delta) > 0.001) {
                        $this->stockService->adjust(
                            productId: $product->id,
                            delta: $delta,
                            note: 'Importación masiva',
                            createdBy: $createdBy,
                            reason: StockMovementReasonEnum::ManualAdjustment,
                        );
                    }
                }

                $resolved['data']['product_id'] = $product->id;
            }
        } catch (InsufficientStockException $e) {
            $resolved['action'] = 'error';
            $resolved['errors'][] = $e->getMessage();
        } catch (Throwable $th) {
            Log::error($th);
            $resolved['action'] = 'error';
            $resolved['errors'][] = 'No se pudo procesar esta fila. Intenta de nuevo.';
        }

        return $resolved;
    }

    private function getOrCreateCategoryId(string $nombre): int
    {
        $key = mb_strtolower($nombre);

        if (isset($this->createdCategoriesInRun[$key])) {
            return $this->createdCategoriesInRun[$key];
        }

        $category = CategoryModel::create([CategoryModel::NOMBRE => $nombre]);
        $this->createdCategoriesInRun[$key] = $category->id;

        return $category->id;
    }

    private const BOOL_TRUE_VALUES = ['1', 'true', 'si', 'sí', 'yes'];

    private const BOOL_FALSE_VALUES = ['0', 'false', 'no'];

    /**
     * Valida una unidad de medida contra UnidadMedidaEnum — texto libre fuera del catálogo
     * (typos, valores de otro idioma, basura) no debe colarse silenciosamente como "unidad";
     * se reporta como warning y se aplica el default, igual que el resto de columnas inválidas.
     *
     * @return array{0: UnidadMedidaEnum, 1: ?string}
     */
    private function resolveUnidadMedida(string $raw): array
    {
        $trimmed = trim($raw);
        if ($trimmed === '') {
            return [UnidadMedidaEnum::Unidad, null];
        }

        $enum = UnidadMedidaEnum::tryFrom(mb_strtolower($trimmed));
        if ($enum !== null) {
            return [$enum, null];
        }

        $valid = implode(', ', array_map(fn (UnidadMedidaEnum $c) => $c->value, UnidadMedidaEnum::cases()));

        return [
            UnidadMedidaEnum::Unidad,
            "Unidad de medida \"{$trimmed}\" no reconocida (valores válidos: {$valid}), se usará \"unidad\".",
        ];
    }

    /**
     * @return array{0: float|null, 1: ?string}
     */
    private function resolveNumericField(string $raw, string $label): array
    {
        $trimmed = trim($raw);
        if ($trimmed === '') {
            return [null, null];
        }

        if (! is_numeric($trimmed) || (float) $trimmed < 0) {
            return [null, "{$label} \"{$trimmed}\" no es un número válido, se ignorará."];
        }

        return [(float) $trimmed, null];
    }

    /**
     * @return array{0: bool, 1: ?string}
     */
    private function resolveBool(string $raw, string $label, bool $default): array
    {
        $trimmed = trim($raw);
        if ($trimmed === '') {
            return [$default, null];
        }

        $normalized = mb_strtolower($trimmed);
        if (in_array($normalized, self::BOOL_TRUE_VALUES, true)) {
            return [true, null];
        }
        if (in_array($normalized, self::BOOL_FALSE_VALUES, true)) {
            return [false, null];
        }

        return [$default, "{$label}: valor \"{$trimmed}\" no reconocido (usa si/no), se usará el valor por defecto."];
    }

    private function buildRowResult(int $line, array $errors, array $warnings, array $data = []): array
    {
        return [
            'row' => $line,
            'action' => $errors ? 'error' : ($data['action'] ?? 'error'),
            'errors' => $errors,
            'warnings' => $warnings,
            'data' => $data,
        ];
    }

    private function buildSummary(array $report): array
    {
        return [
            'total' => count($report),
            'to_create' => count(array_filter($report, fn ($r) => $r['action'] === 'create')),
            'to_update' => count(array_filter($report, fn ($r) => $r['action'] === 'update')),
            'errors' => count(array_filter($report, fn ($r) => $r['action'] === 'error')),
            'warnings' => count(array_filter($report, fn ($r) => count($r['warnings']) > 0)),
        ];
    }
}
