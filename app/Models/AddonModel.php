<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AddonModel extends Model
{
    use HasFactory, HasTenant, SoftDeletes;

    protected $table = 'addons';

    const NAME = 'name';

    const PRICE = 'price';

    const IS_ACTIVE = 'is_active';

    const TENANT_ID = 'tenant_id';

    protected $casts = [
        self::PRICE => 'float',
        self::IS_ACTIVE => 'boolean',
    ];

    protected $fillable = [
        self::NAME,
        self::PRICE,
        self::IS_ACTIVE,
        self::TENANT_ID,
    ];

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(ProductModel::class, 'addon_product', 'addon_id', 'product_id');
    }
}
