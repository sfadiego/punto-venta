<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariantModel extends Model
{
    use HasFactory, HasTenant;

    protected $table = 'product_variants';

    const PRODUCT_ID = 'product_id';

    const NOMBRE = 'nombre';

    const PRECIO = 'precio';

    const ORDEN = 'orden';

    const ACTIVO = 'activo';

    const STOCK = 'stock';

    const MIN_STOCK = 'min_stock';

    const TENANT_ID = 'tenant_id';

    protected $casts = [
        self::ACTIVO => 'boolean',
        self::PRECIO => 'float',
        self::STOCK => 'decimal:2',
        self::MIN_STOCK => 'decimal:2',
    ];

    protected $fillable = [
        self::PRODUCT_ID,
        self::NOMBRE,
        self::PRECIO,
        self::ORDEN,
        self::ACTIVO,
        self::STOCK,
        self::MIN_STOCK,
        self::TENANT_ID,
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(ProductModel::class, self::PRODUCT_ID, 'id');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovementModel::class, StockMovementModel::VARIANT_ID, 'id');
    }

    public function hasLowStock(): bool
    {
        if ($this->stock === null) {
            return false;
        }

        // Sin min_stock configurado se asume 0 — una variante en 0 existencias siempre debe
        // marcarse como bajo stock, tenga o no un mínimo definido.
        $minStock = $this->min_stock !== null ? (float) $this->min_stock : 0;

        return (float) $this->stock <= $minStock;
    }
}
