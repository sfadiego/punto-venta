<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProductImageModel extends Model
{
    use HasFactory, HasTenant;

    protected $table = 'product_image';

    const NOMBRE_ARCHIVO = 'nombre_archivo';

    const URL = 'url';

    const ARCHIVO = 'archivo';

    const FOTO_ID = 'foto_id';

    const TENANT_ID = 'tenant_id';

    protected $fillable = [
        self::NOMBRE_ARCHIVO,
        self::URL,
        self::TENANT_ID,
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(ProductModel::class, 'id', 'foto_id');
    }

    public static function deleteFile(?string $nombreArchivo): void
    {
        if (! $nombreArchivo) {
            return;
        }

        $path = "private/{$nombreArchivo}";

        if (Storage::disk('local')->exists($path)) {
            Storage::disk('local')->delete($path);
        }
    }

    public static function processImage(UploadedFile $file, string $tenantSlug): array|false
    {
        try {
            $extension = $file->getClientOriginalExtension();
            $filename = time().'_'.uniqid().".$extension";
            $folder = "private/{$tenantSlug}";

            $path = $file->storeAs($folder, $filename, 'local');

            return [
                self::NOMBRE_ARCHIVO => "{$tenantSlug}/{$filename}",
                self::URL => $path,
            ];
        } catch (\Throwable $th) {
            Log::error($th->getMessage());

            return false;
        }
    }
}
