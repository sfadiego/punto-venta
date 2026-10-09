<?php

namespace App\Services;

use App\Enums\OrderStatusEnum;
use App\Enums\StockMovementTypeEnum;
use App\Models\ProductModel;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\DB;

/**
 * Reporte de productos con mucho tiempo sin movimiento (retail con stock activo): qué productos
 * tienen existencia pero no se venden, para decidir rebajas o promociones.
 *
 * "Sin movimiento" se mide desde la fecha de referencia de cada producto: la más reciente entre su
 * última venta (orden cerrada o apartado), su último ingreso de stock (entrada, carga inicial o
 * ajuste positivo) y su alta. Un producto recién surtido o recién dado de alta no se marca aunque
 * aún no se haya vendido. El stock es compartido entre sucursales, así que se mide para todo el
 * negocio. El valor estancado es stock × precio de venta (no existe costo de compra).
 *
 * Todo se calcula en SQL con agregados por producto (un join por fuente, sin consulta por
 * producto). Las únicas expresiones que dependen del motor son GREATEST y la diferencia de días,
 * porque producción es MySQL y las pruebas corren en SQLite.
 */
class SlowMovingProductsReport
{
    public const DEFAULT_DAYS = 60;

    // Ventana para "vendido en N días" — distingue "no se mueve" de "se mueve poco".
    public const SOLD_WINDOW_DAYS = 90;

    // Columnas por las que se puede ordenar el listado → su expresión SQL. "days_idle" se ordena
    // por la fecha de referencia invertida (más días = referencia más antigua).
    private const SORTABLE = ['product_code', 'nombre', 'categoria', 'entry_date', 'last_restock_at', 'last_sale_at', 'days_idle', 'stock', 'precio', 'inventory_value', 'sold_90d'];

    /**
     * Productos con stock (> 0) y control de stock. Con $days, solo los que llevan al menos esos
     * días sin movimiento; sin $days, todo el inventario con existencia (base para porcentajes).
     */
    public function query(?int $days, ?string $search = null, ?int $categoryId = null): Builder
    {
        $stock = $this->stockExpression();
        $reference = $this->referenceExpression();

        $query = ProductModel::query()
            ->leftJoinSub($this->variantsAggregate(), 'vs', 'vs.product_id', '=', 'product.id')
            ->leftJoinSub($this->salesAggregate(), 'sales', 'sales.producto_id', '=', 'product.id')
            ->leftJoinSub($this->restockAggregate(), 'restock', 'restock.product_id', '=', 'product.id')
            ->leftJoin('categories', 'categories.id', '=', 'product.categoria_id')
            ->where('product.manage_stock', true)
            ->whereRaw("({$stock}) > 0")
            ->select(['product.id', 'product.product_code', 'product.nombre', 'product.precio'])
            // Fecha de ingreso = alta del producto. Con alias (sin el cast datetime de created_at) viaja
            // como texto local "AAAA-MM-DD HH:MM:SS", igual que las demás fechas del reporte.
            ->selectRaw('product.created_at as entry_date')
            ->selectRaw('categories.nombre as categoria')
            ->selectRaw("({$stock}) as stock")
            ->selectRaw('('.$this->valueExpression().') as inventory_value')
            ->selectRaw('restock.last_restock_at as last_restock_at')
            ->selectRaw('sales.last_sale_at as last_sale_at')
            ->selectRaw('COALESCE(sales.sold_90d, 0) as sold_90d')
            ->selectRaw("({$reference}) as reference_at")
            ->selectRaw('('.$this->daysSince($reference).') as days_idle', [Carbon::today()->toDateString()]);

        if ($days !== null) {
            // Fecha de referencia <= hoy − N días ⇔ las tres fechas que la forman <= ese corte.
            $cutoff = Carbon::today()->subDays($days)->endOfDay();
            $query->where('product.created_at', '<=', $cutoff)
                ->where(fn ($q) => $q->whereNull('sales.last_sale_at')->orWhere('sales.last_sale_at', '<=', $cutoff))
                ->where(fn ($q) => $q->whereNull('restock.last_restock_at')->orWhere('restock.last_restock_at', '<=', $cutoff));
        }

        if ($search) {
            // product_code es match exacto (viene de un lector de código de barras) — mismo
            // criterio que ProductsService::makeQuery().
            $query->where(fn ($q) => $q->where('product.nombre', 'like', "%{$search}%")->orWhere('product.product_code', $search));
        }

        if ($categoryId) {
            $query->where('product.categoria_id', $categoryId);
        }

        return $query;
    }

    /** Ordena por una columna permitida; cualquier otra (o ninguna) cae al orden por defecto: más días sin movimiento primero. */
    public function applyOrder(Builder $query, ?string $orderParam, ?string $direction): Builder
    {
        // IndexData manda orderParam=id / order=asc cuando el cliente no pide un orden: eso cae al
        // orden por defecto completo (más días primero), no solo a la columna.
        $isKnown = in_array($orderParam, self::SORTABLE, true);
        $column = $isKnown ? $orderParam : 'days_idle';
        $direction = $isKnown && strtolower((string) $direction) === 'asc' ? 'asc' : 'desc';

        $expression = match ($column) {
            'product_code' => 'product.product_code',
            'nombre' => 'product.nombre',
            'categoria' => 'categories.nombre',
            'entry_date' => 'product.created_at',
            'last_restock_at' => 'restock.last_restock_at',
            'last_sale_at' => 'sales.last_sale_at',
            'stock' => $this->stockExpression(),
            'precio' => 'product.precio',
            'inventory_value' => $this->valueExpression(),
            'sold_90d' => 'COALESCE(sales.sold_90d, 0)',
            default => $this->referenceExpression(),
        };

        // Más días sin movimiento = fecha de referencia más antigua: el sentido se invierte.
        if ($column === 'days_idle') {
            $direction = $direction === 'desc' ? 'asc' : 'desc';
        }

        return $query->orderByRaw("({$expression}) {$direction}")->orderBy('product.id');
    }

    /**
     * Resumen para las tarjetas: cuántos productos están estancados, su valor estancado y qué
     * porcentaje del valor total del inventario con existencia representan. Una sola pasada sobre
     * el inventario con existencia (conteo y valor total + los que cumplen el umbral), en lugar de
     * una consulta por cifra — el cálculo base es lo costoso.
     *
     * @return array{days: int, as_of: string, stale_count: int, stale_value: float, inventory_value: float, stale_value_percent: float}
     */
    public function summary(int $days): array
    {
        $cutoff = Carbon::today()->subDays($days)->endOfDay();

        $row = DB::query()
            ->fromSub($this->query(null)->reorder()->toBase(), 't')
            ->selectRaw(
                'COALESCE(SUM(inventory_value), 0) as inventory_value, '
                .'COALESCE(SUM(CASE WHEN reference_at <= ? THEN 1 ELSE 0 END), 0) as stale_count, '
                .'COALESCE(SUM(CASE WHEN reference_at <= ? THEN inventory_value ELSE 0 END), 0) as stale_value',
                [$cutoff, $cutoff]
            )
            ->first();

        $inventoryValue = round((float) $row->inventory_value, 2);
        $staleValue = round((float) $row->stale_value, 2);

        return [
            'days' => $days,
            'as_of' => Carbon::today()->toDateString(),
            'stale_count' => (int) $row->stale_count,
            'stale_value' => $staleValue,
            'inventory_value' => $inventoryValue,
            'stale_value_percent' => $inventoryValue > 0 ? round($staleValue / $inventoryValue * 100, 1) : 0.0,
        ];
    }

    // ── Agregados por producto ───────────────────────────────

    /** Variantes activas: con ellas el stock y su valor viven en cada variante (product.stock queda en null). */
    private function variantsAggregate(): QueryBuilder
    {
        return DB::table('product_variants')
            ->where('activo', true)
            ->groupBy('product_id')
            ->selectRaw('product_id, COUNT(*) as variants_count, COALESCE(SUM(stock), 0) as variants_stock, COALESCE(SUM(stock * precio), 0) as variants_value');
    }

    /** Última venta y unidades vendidas en la ventana — cuentan órdenes cerradas y apartados activos. */
    private function salesAggregate(): QueryBuilder
    {
        return DB::table('order_product as op')
            ->join('order as o', 'o.id', '=', 'op.pedido_id')
            ->whereIn('o.estatus_pedido_id', [OrderStatusEnum::CLOSED->value, OrderStatusEnum::LAYAWAY->value])
            ->whereNull('o.deleted_at')
            ->whereNotNull('op.producto_id')
            ->where('o.tenant_id', app('tenant_id'))
            ->groupBy('op.producto_id')
            ->selectRaw(
                'op.producto_id, MAX(o.created_at) as last_sale_at, COALESCE(SUM(CASE WHEN o.created_at >= ? THEN op.cantidad ELSE 0 END), 0) as sold_90d',
                [Carbon::today()->subDays(self::SOLD_WINDOW_DAYS)->startOfDay()]
            );
    }

    /**
     * Último ingreso de stock: una entrada o un ajuste positivo (incluye movimientos de variantes).
     * La carga inicial también cae aquí (se registra como entrada o ajuste positivo), así que no
     * se filtra por `reason`: un OR sobre otra columna impediría usar el índice por `type`
     * (stock_movements_tenant_type_product_created_idx) y obligaría a leer todas las salidas.
     */
    private function restockAggregate(): QueryBuilder
    {
        return DB::table('stock_movements')
            ->where('tenant_id', app('tenant_id'))
            ->where(function ($q) {
                $q->where('type', StockMovementTypeEnum::Entry->value)
                    ->orWhere(fn ($adjustment) => $adjustment
                        ->where('type', StockMovementTypeEnum::Adjustment->value)
                        ->whereColumn('stock_after', '>', 'stock_before'));
            })
            ->groupBy('product_id')
            ->selectRaw('product_id, MAX(created_at) as last_restock_at');
    }

    // ── Expresiones SQL ──────────────────────────────────────

    private function stockExpression(): string
    {
        return 'CASE WHEN vs.variants_count > 0 THEN vs.variants_stock ELSE COALESCE(product.stock, 0) END';
    }

    private function valueExpression(): string
    {
        return 'CASE WHEN vs.variants_count > 0 THEN vs.variants_value ELSE COALESCE(product.stock, 0) * product.precio END';
    }

    private function referenceExpression(): string
    {
        $dates = [
            'COALESCE(sales.last_sale_at, product.created_at)',
            'COALESCE(restock.last_restock_at, product.created_at)',
            'product.created_at',
        ];

        // MySQL: GREATEST(...); SQLite (pruebas): MAX(...) con varios argumentos hace lo mismo.
        return (DB::getDriverName() === 'sqlite' ? 'MAX' : 'GREATEST').'('.implode(', ', $dates).')';
    }

    /** Días de calendario entre la fecha de referencia y hoy (un `?` = la fecha de hoy). */
    private function daysSince(string $reference): string
    {
        return DB::getDriverName() === 'sqlite'
            ? "CAST(julianday(?) - julianday(date({$reference})) AS INTEGER)"
            : "DATEDIFF(?, DATE({$reference}))";
    }
}
