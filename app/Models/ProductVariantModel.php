<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariantModel extends Model
{
    use HasFactory, HasTenant;

    protected $table = 'product_variants';

    const PRODUCT_ID = 'product_id';

    const NOMBRE = 'nombre';

    const PRECIO = 'precio';

    const ORDEN = 'orden';

    const ACTIVO = 'activo';

    const TENANT_ID = 'tenant_id';

    protected $casts = [
        self::ACTIVO => 'boolean',
        self::PRECIO => 'float',
    ];

    protected $fillable = [
        self::PRODUCT_ID,
        self::NOMBRE,
        self::PRECIO,
        self::ORDEN,
        self::ACTIVO,
        self::TENANT_ID,
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(ProductModel::class, self::PRODUCT_ID, 'id');
    }
}
