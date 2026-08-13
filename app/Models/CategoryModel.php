<?php

namespace App\Models;

use App\Enums\IconSourceEnum;
use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CategoryModel extends Model
{
    use HasFactory, HasTenant, SoftDeletes;

    protected $table = 'categories';

    const NOMBRE = 'nombre';

    const FOTO_ID = 'foto_id';

    const ORDEN = 'orden';

    const ICON_NAME = 'icon_name';

    const ICON_SOURCE = 'icon_source';

    const TENANT_ID = 'tenant_id';

    protected $casts = [
        self::ICON_SOURCE => IconSourceEnum::class,
    ];

    protected $fillable = [
        self::NOMBRE,
        self::FOTO_ID,
        self::ORDEN,
        self::ICON_NAME,
        self::ICON_SOURCE,
        self::TENANT_ID,
    ];

    public function products(): HasMany
    {
        return $this->hasMany(ProductModel::class, 'categoria_id', 'id');
    }

    public static function getCategories(string $categoryName = ''): Collection
    {
        return CategoryModel::when($categoryName !== '', function ($q) use ($categoryName) {
            $q->where(self::NOMBRE, 'like', "%$categoryName%");
        })
            ->get();
    }
}
