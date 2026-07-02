<?php

namespace App\Models;

use App\Enums\UnidadMedidaEnum;
use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

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

    protected $casts = [
        self::UNIDAD_MEDIDA => UnidadMedidaEnum::class,
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
    ];

    public static function store(
        string $nombre,
        float $precio,
        string $descripcion,
        int $categoriaId,
        ?string $pictureId = null,
    ): ProductModel {

        return ProductModel::create([
            ProductModel::NOMBRE => $nombre,
            ProductModel::PRECIO => $precio,
            ProductModel::DESCRIPCION => $descripcion,
            ProductModel::CATEGORIA_ID => $categoriaId,
            ProductModel::ACTIVO => 1,
            ProductModel::FOTO_ID => $pictureId,
        ]);
    }

    // @deprecated
    public static function getProducts(string $productName = '', int $categoriaId = 0): Collection
    {
        return ProductModel::with(['picture', 'category'])
            ->when($productName !== '', function ($q) use ($productName) {
                $q->where(self::NOMBRE, 'like', "%$productName%");
            })
            ->when($categoriaId !== 0, function ($q) use ($categoriaId) {
                $q->where(self::CATEGORIA_ID, $categoriaId);
            })
            ->get();
    }

    public function updateProduct(
        ?string $nombre,
        ?float $precio,
        ?string $descripcion,
        ?int $categoriaId,
        ?int $pictureId,
        ?bool $active,
        ?string $unidadMedida = null,
    ): ProductModel {

        $data = [];
        if ($nombre       !== null) $data[ProductModel::NOMBRE]        = $nombre;
        if ($precio       !== null) $data[ProductModel::PRECIO]        = $precio;
        if ($descripcion  !== null) $data[ProductModel::DESCRIPCION]   = $descripcion;
        if ($categoriaId  !== null) $data[ProductModel::CATEGORIA_ID]  = $categoriaId;
        if ($active       !== null) $data[ProductModel::ACTIVO]        = $active;
        if ($pictureId    !== null) $data[ProductModel::FOTO_ID]       = $pictureId;
        if ($unidadMedida !== null) $data[ProductModel::UNIDAD_MEDIDA] = $unidadMedida;

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
}
