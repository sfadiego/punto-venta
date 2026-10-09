<?php

namespace Tests\Feature;

use App\Enums\IconSourceEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use Database\Seeders\CategoriesIconsSeeder;
use Tests\TestCase;

/**
 * El seeder de íconos corre en cada despliegue: solo debe completar categorías sin ícono y nunca
 * pisar el que el usuario eligió (ver el comentario del seeder).
 */
class CategoriesIconsSeederTest extends TestCase
{
    private function categoria(string $nombre): CategoryModel
    {
        return CategoryModel::where(CategoryModel::NOMBRE, $nombre)->firstOrFail();
    }

    public function test_no_pisa_el_icono_que_el_usuario_eligio(): void
    {
        // El usuario cambió "CAFÉ" a un emoji de OpenMoji desde la interfaz.
        $this->categoria('CAFÉ')->update([
            CategoryModel::ICON_NAME => '2615',
            CategoryModel::ICON_SOURCE => IconSourceEnum::Openmoji->value,
        ]);

        $this->seed(CategoriesIconsSeeder::class);

        $cafe = $this->categoria('CAFÉ');
        $this->assertSame('2615', $cafe->icon_name);
        $this->assertSame(IconSourceEnum::Openmoji, $cafe->icon_source);
    }

    public function test_completa_las_categorias_sin_icono_con_nombre_y_origen_coherentes(): void
    {
        // Estado roto típico: sin nombre pero con un origen que no es Lucide.
        $this->categoria('POSTRES')->update([
            CategoryModel::ICON_NAME => '',
            CategoryModel::ICON_SOURCE => IconSourceEnum::Openmoji->value,
        ]);
        $this->categoria('PANINIS')->update([
            CategoryModel::ICON_NAME => '',
            CategoryModel::ICON_SOURCE => IconSourceEnum::Native->value,
        ]);

        $this->seed(CategoriesIconsSeeder::class);

        foreach (['POSTRES' => 'Cake', 'PANINIS' => 'Sandwich'] as $nombre => $icono) {
            $categoria = $this->categoria($nombre);
            $this->assertSame($icono, $categoria->icon_name);
            $this->assertSame(IconSourceEnum::Lucide, $categoria->icon_source);
        }
    }

    public function test_no_toca_categorias_que_no_estan_en_la_lista_sembrada(): void
    {
        $propia = CategoryModel::create([
            CategoryModel::NOMBRE => 'Categoría propia',
            CategoryModel::ICON_NAME => '',
            CategoryModel::ICON_SOURCE => IconSourceEnum::Openmoji->value,
            CategoryModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        $this->seed(CategoriesIconsSeeder::class);

        $propia->refresh();
        $this->assertSame('', $propia->icon_name);
        $this->assertSame(IconSourceEnum::Openmoji, $propia->icon_source);
    }

    public function test_correrlo_varias_veces_no_cambia_nada(): void
    {
        $this->categoria('ENSALADAS')->update([
            CategoryModel::ICON_NAME => '1F957',
            CategoryModel::ICON_SOURCE => IconSourceEnum::Native->value,
        ]);

        $this->seed(CategoriesIconsSeeder::class);
        $this->seed(CategoriesIconsSeeder::class);

        $ensaladas = $this->categoria('ENSALADAS');
        $this->assertSame('1F957', $ensaladas->icon_name);
        $this->assertSame(IconSourceEnum::Native, $ensaladas->icon_source);
        $this->assertSame('Coffee', $this->categoria('CAFÉ')->icon_name);
    }
}
