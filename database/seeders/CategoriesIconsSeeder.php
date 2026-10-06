<?php

namespace Database\Seeders;

use App\Enums\IconSourceEnum;
use App\Models\CategoryModel;
use Illuminate\Database\Seeder;

/**
 * Íconos iniciales de las categorías sembradas. Este seeder corre en CADA despliegue (ver
 * docker/php/laravel_setup.sh), así que solo debe completar categorías que todavía no tienen
 * ícono: sobrescribir uno elegido por el usuario deshacía su cambio y, al no tocar icon_source,
 * dejaba un nombre de Lucide (ej. "Sparkles") con origen OpenMoji/emoji, que se pinta como una
 * imagen rota. Al asignar un ícono se escribe también icon_source para dejar el par coherente.
 */
class CategoriesIconsSeeder extends Seeder
{
    public function run(): void
    {
        $icons = [
            'CAFÉ' => 'Coffee',
            'TISANA' => 'Leaf',
            'SODA ITALIANA' => 'Sparkles',     // lucide: sparkles
            'SMOOTHIE' => 'GlassWater',        // lucide: glass-water
            'WAFFLES & CREPAS' => 'Grid',      // lucide: grid (as substitute)
            'PANINIS' => 'Sandwich',           // lucide: sandwich
            'ENSALADAS' => 'Salad',            // lucide: salad
            'POSTRES' => 'Cake',               // lucide: cake
            'OTROS' => 'Tag',                  // lucide: tag
            'FRAPPÉ' => 'IceCream',            // lucide: ice-cream
            'SÁNDWICH' => 'Sandwich',
            'EXTRAS' => 'Plus',                // lucide: plus
            'LECHITAS' => 'Milk',              // lucide: milk
            'Naturales' => 'Leaf',
            'CHOCOLATES' => 'IceCream',
            '+18' => 'Lock',                   // lucide: lock (age restricted)
            'PA PICAR' => 'Utensils',          // lucide: utensils
            'TEMPORADA' => 'Calendar',         // lucide: calendar
        ];

        foreach ($icons as $nombre => $iconName) {
            CategoryModel::where(CategoryModel::NOMBRE, $nombre)
                // icon_name es NOT NULL con default '' (ver la migración de categories): vacío = sin ícono.
                ->where(CategoryModel::ICON_NAME, '')
                ->update([
                    CategoryModel::ICON_NAME => $iconName,
                    CategoryModel::ICON_SOURCE => IconSourceEnum::Lucide->value,
                ]);
        }
    }
}
