<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Complemento elegido en una línea de orden. name/price son una copia al momento de la
 * venta: cambiar o borrar el complemento del catálogo no altera ventas pasadas.
 */
class OrderProductAddonModel extends Model
{
    use HasFactory, HasTenant;

    protected $table = 'order_product_addons';

    const ORDER_PRODUCT_ID = 'order_product_id';

    const ADDON_ID = 'addon_id';

    const NAME = 'name';

    const PRICE = 'price';

    const QUANTITY = 'quantity';

    const TENANT_ID = 'tenant_id';

    protected $casts = [
        self::PRICE => 'float',
        self::QUANTITY => 'integer',
    ];

    protected $fillable = [
        self::ORDER_PRODUCT_ID,
        self::ADDON_ID,
        self::NAME,
        self::PRICE,
        self::QUANTITY,
        self::TENANT_ID,
    ];

    public function orderProduct(): BelongsTo
    {
        return $this->belongsTo(OrderProductModel::class, self::ORDER_PRODUCT_ID);
    }

    public function addon(): BelongsTo
    {
        return $this->belongsTo(AddonModel::class, self::ADDON_ID);
    }
}
