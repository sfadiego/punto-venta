<?php

namespace Database\Seeders;

use App\Models\BusinessConfigModel;
use Illuminate\Database\Seeder;

class BusinessConfigSeeder extends Seeder
{
    public function run(): void
    {
        $slug = config('tenant.default_slug');

        // withTrashed(): este seeder corre en cada arranque del contenedor (no solo en el primer
        // deploy — ver docker/php/laravel_setup.sh), así que su chequeo de existencia debe ver
        // también filas con soft-delete. Sin esto, un tenant borrado (soft-delete) deja de
        // "existir" para estas queries y el firstOrCreate de abajo intenta insertarlo de nuevo,
        // chocando con el unique de `slug` a nivel de BD (bug real visto en producción).
        $existing = BusinessConfigModel::withTrashed()->whereNull('slug')->first()
            ?? BusinessConfigModel::withTrashed()->where('slug', $slug)->first();

        if ($existing) {
            if ($existing->slug !== $slug) {
                $existing->update(['slug' => $slug]);
            }

            return;
        }

        BusinessConfigModel::withTrashed()->firstOrCreate(
            [BusinessConfigModel::SLUG => $slug],
            [
                BusinessConfigModel::BUSINESS_NAME => config('app.name'),
                BusinessConfigModel::PRIMARY_COLOR => '#f59e0b',
                BusinessConfigModel::SIDEBAR_COLOR => '#1c1917',
                BusinessConfigModel::FONT_COLOR => '#ffffff',
                BusinessConfigModel::LABEL_COLOR => '#1c1917',
            ]
        );
    }
}
