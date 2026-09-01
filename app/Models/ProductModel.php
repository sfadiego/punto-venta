<?php

namespace App\Models;

use App\Enums\IconSourceEnum;
use App\Enums\UnidadMedidaEnum;
use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ProductModel extends Model
{
    use HasFactory, HasTenant, SoftDeletes;

    protected $table = 'product';

    const NOMBRE = 'nombre';

    const PRECIO = 'precio';

    const DESCRIPCION = 'descripcion';

    const CATEGORIA_ID = 'categoria_id';

    const ACTIVO = 'activo';

    const FOTO_ID = 'foto_id';

    const TENANT_ID = 'tenant_id';

    const UNIDAD_MEDIDA = 'unidad_medida';

    const MANAGE_STOCK = 'manage_stock';

    const STOCK = 'stock';

    const MIN_STOCK = 'min_stock';

    const PRODUCT_CODE = 'product_code';

    const ICON_NAME = 'icon_name';

    const ICON_SOURCE = 'icon_source';

    const MIN_STOCK_DEFAULT = 2;

    protected $casts = [
        self::UNIDAD_MEDIDA => UnidadMedidaEnum::class,
        self::MANAGE_STOCK => 'boolean',
        self::STOCK => 'decimal:2',
        self::MIN_STOCK => 'decimal:2',
        self::ICON_SOURCE => IconSourceEnum::class,
    ];

    protected $fillable = [
        self::NOMBRE,
        self::PRECIO,
        self::DESCRIPCION,
        self::CATEGORIA_ID,
        self::ACTIVO,
        self::FOTO_ID,
        self::TENANT_ID,
        self::UNIDAD_MEDIDA,
        self::MANAGE_STOCK,
        self::STOCK,
        self::MIN_STOCK,
        self::PRODUCT_CODE,
        self::ICON_NAME,
        self::ICON_SOURCE,
    ];

    public static function store(
        string $nombre,
        float $precio,
        string $descripcion,
        int $categoriaId,
        ?string $pictureId = null,
        ?string $iconName = null,
        ?string $iconSource = null,
    ): ProductModel {

        return ProductModel::create([
            ProductModel::NOMBRE => $nombre,
            ProductModel::PRECIO => $precio,
            ProductModel::DESCRIPCION => $descripcion,
            ProductModel::CATEGORIA_ID => $categoriaId,
            ProductModel::ACTIVO => 1,
            ProductModel::FOTO_ID => $pictureId,
            ProductModel::ICON_NAME => $iconName,
            ProductModel::ICON_SOURCE => $iconSource,
        ]);
    }

    /**
     * generateProductCode — arma un código a partir del nombre del producto para el
     * lector de código de barras cuando el usuario no captura uno manualmente.
     * No es un EAN/UPC real, solo un identificador legible y único por tenant que se
     * puede escanear/buscar igual que uno capturado a mano.
     */
    public static function generateProductCode(string $nombre): string
    {
        $base = Str::upper(preg_replace('/[^A-Z0-9]/', '', Str::ascii($nombre)));
        $base = Str::substr($base, 0, 8) ?: 'PROD';

        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        do {
            $code = $base.str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        } while (
            static::withTrashed()
                ->where(self::PRODUCT_CODE, $code)
                ->when($tenantId, fn ($q) => $q->where(self::TENANT_ID, $tenantId))
                ->exists()
        );

        return $code;
    }

    public function updateProduct(
        ?string $nombre,
        ?float $precio,
        ?string $descripcion,
        ?int $categoriaId,
        ?int $pictureId,
        ?bool $active,
        ?string $unidadMedida = null,
        ?bool $manageStock = null,
        ?float $minStock = null,
        ?string $productCode = null,
        ?string $iconName = null,
        ?string $iconSource = null,
    ): ProductModel {

        $data = [];
        if ($nombre !== null) {
            $data[ProductModel::NOMBRE] = $nombre;
        }
        if ($precio !== null) {
            $data[ProductModel::PRECIO] = $precio;
        }
        if ($descripcion !== null) {
            $data[ProductModel::DESCRIPCION] = $descripcion;
        }
        if ($categoriaId !== null) {
            $data[ProductModel::CATEGORIA_ID] = $categoriaId;
        }
        if ($active !== null) {
            $data[ProductModel::ACTIVO] = $active;
        }
        if ($pictureId !== null) {
            $data[ProductModel::FOTO_ID] = $pictureId;
        }
        if ($unidadMedida !== null) {
            $data[ProductModel::UNIDAD_MEDIDA] = $unidadMedida;
        }
        $hasActiveVariants = $this->variants()->where(ProductVariantModel::ACTIVO, true)->exists();

        if ($manageStock !== null) {
            $data[ProductModel::MANAGE_STOCK] = $manageStock;
            // al desactivar el control de stock se limpia la existencia y el mínimo:
            // hasLowStock() y el resto del flujo asumen que ambos son null cuando
            // manage_stock es false, para no mostrar cifras obsoletas.
            if (! $manageStock) {
                $data[ProductModel::STOCK] = null;
                $data[ProductModel::MIN_STOCK] = null;
            } elseif ($hasActiveVariants) {
                // Con variantes activas el stock vive por variante — el nivel producto
                // queda sin usar (ver ProductVariantService::backfillStockOnActivation()
                // para la inicialización de las variantes existentes).
                $data[ProductModel::STOCK] = null;
                $data[ProductModel::MIN_STOCK] = null;
            } else {
                // se activa manage_stock sin indicar cantidad/mínimo explícitos: mismos
                // defaults que store() (0 y 2) en vez de dejar las columnas en null.
                if ($this->stock === null) {
                    $data[ProductModel::STOCK] = 0;
                }
                if ($minStock === null) {
                    $data[ProductModel::MIN_STOCK] = self::MIN_STOCK_DEFAULT;
                }
            }
        }
        if ($minStock !== null && ($manageStock ?? $this->manage_stock) && ! $hasActiveVariants) {
            $data[ProductModel::MIN_STOCK] = $minStock;
        }
        if ($productCode !== null) {
            $data[ProductModel::PRODUCT_CODE] = $productCode !== '' ? $productCode : null;
        }
        if ($iconName !== null) {
            $data[ProductModel::ICON_NAME] = $iconName;
        }
        if ($iconSource !== null) {
            $data[ProductModel::ICON_SOURCE] = $iconSource;
        }

        $this->update($data);

        return $this->refresh();
    }

    public function picture(): HasOne
    {
        return $this->hasOne(ProductImageModel::class, 'id', 'foto_id');
    }

    public function category(): HasOne
    {
        return $this->hasOne(CategoryModel::class, 'id', 'categoria_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariantModel::class, ProductVariantModel::PRODUCT_ID, 'id')
            ->orderBy(ProductVariantModel::ORDEN);
    }

    public function hasVariants(): bool
    {
        if ($this->relationLoaded('variants')) {
            return $this->variants->where(ProductVariantModel::ACTIVO, true)->isNotEmpty();
        }

        return $this->variants()->where(ProductVariantModel::ACTIVO, true)->exists();
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovementModel::class, StockMovementModel::PRODUCT_ID, 'id');
    }

    public function hasLowStock(): bool
    {
        if (! $this->manage_stock || $this->stock === null) {
            return false;
        }

        // Sin min_stock configurado se asume 0 — un producto en 0 existencias siempre debe
        // marcarse como bajo stock, tenga o no un mínimo definido.
        $minStock = $this->min_stock !== null ? (float) $this->min_stock : 0;

        return (float) $this->stock <= $minStock;
    }
}
