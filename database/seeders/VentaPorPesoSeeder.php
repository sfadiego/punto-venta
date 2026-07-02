<?php

namespace Database\Seeders;

use App\Enums\UnidadMedidaEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\ProductModel;
use Illuminate\Database\Seeder;

class VentaPorPesoSeeder extends Seeder
{
    public function run(): void
    {
        $slug = $this->command->option('slug') ?? env('APP_TENANT_SLUG', 'pos-app');

        [$tenant, $created] = $this->resolveOrCreateTenant($slug);
        $tenantId = $tenant->id;

        if ($created) {
            $this->command->info("Tenant [{$slug}] creado con tipo 'venta_por_peso'.");
        } else {
            $this->command->info("Tenant [{$tenant->business_name}] encontrado (id={$tenantId}).");
        }

        $catalog = [
            'Res' => [
                ['nombre' => 'Bistec de res',        'precio' => 120.00, 'unidad' => UnidadMedidaEnum::Kg],
                ['nombre' => 'Carne molida',          'precio' => 95.00,  'unidad' => UnidadMedidaEnum::Kg],
                ['nombre' => 'Costilla de res',       'precio' => 85.00,  'unidad' => UnidadMedidaEnum::Kg],
                ['nombre' => 'Retazo para caldo',     'precio' => 70.00,  'unidad' => UnidadMedidaEnum::Kg],
                ['nombre' => 'Chambarete',            'precio' => 80.00,  'unidad' => UnidadMedidaEnum::Kg],
            ],
            'Cerdo' => [
                ['nombre' => 'Chuleta de cerdo',      'precio' => 90.00,  'unidad' => UnidadMedidaEnum::Kg],
                ['nombre' => 'Pierna de cerdo',       'precio' => 85.00,  'unidad' => UnidadMedidaEnum::Kg],
                ['nombre' => 'Costilla de cerdo',     'precio' => 78.00,  'unidad' => UnidadMedidaEnum::Kg],
                ['nombre' => 'Tocino rebanado',       'precio' => 110.00, 'unidad' => UnidadMedidaEnum::Kg],
                ['nombre' => 'Lomo de cerdo',         'precio' => 95.00,  'unidad' => UnidadMedidaEnum::Kg],
            ],
            'Pollo' => [
                ['nombre' => 'Pollo entero',          'precio' => 45.00,  'unidad' => UnidadMedidaEnum::Kg],
                ['nombre' => 'Pechuga sin hueso',     'precio' => 80.00,  'unidad' => UnidadMedidaEnum::Kg],
                ['nombre' => 'Muslo con pierna',      'precio' => 55.00,  'unidad' => UnidadMedidaEnum::Kg],
                ['nombre' => 'Ala de pollo',          'precio' => 50.00,  'unidad' => UnidadMedidaEnum::Kg],
                ['nombre' => 'Mollejas de pollo',     'precio' => 40.00,  'unidad' => UnidadMedidaEnum::Kg],
            ],
            'Embutidos' => [
                ['nombre' => 'Chorizo',               'precio' => 95.00,  'unidad' => UnidadMedidaEnum::Kg],
                ['nombre' => 'Salchicha Frankfurt',   'precio' => 70.00,  'unidad' => UnidadMedidaEnum::Kg],
                ['nombre' => 'Jamón de pierna',       'precio' => 85.00,  'unidad' => UnidadMedidaEnum::Kg],
                ['nombre' => 'Longaniza',             'precio' => 88.00,  'unidad' => UnidadMedidaEnum::Kg],
                ['nombre' => 'Mortadela',             'precio' => 60.00,  'unidad' => UnidadMedidaEnum::Kg],
            ],
        ];

        foreach ($catalog as $categoryName => $products) {
            $category = CategoryModel::updateOrCreate(
                [
                    CategoryModel::NOMBRE => $categoryName,
                    CategoryModel::TENANT_ID => $tenantId,
                ],
            );

            foreach ($products as $p) {
                ProductModel::updateOrCreate(
                    [
                        ProductModel::NOMBRE => $p['nombre'],
                        ProductModel::TENANT_ID => $tenantId,
                    ],
                    [
                        ProductModel::PRECIO => $p['precio'],
                        ProductModel::DESCRIPCION => '',
                        ProductModel::CATEGORIA_ID => $category->id,
                        ProductModel::ACTIVO => true,
                        ProductModel::UNIDAD_MEDIDA => $p['unidad']->value,
                    ],
                );
            }
        }

        $this->command->info("Venta por peso [{$tenant->business_name}]: 4 categorías y 20 productos creados.");
    }

    private function resolveOrCreateTenant(string $slug): array
    {
        $tenant = BusinessConfigModel::where(BusinessConfigModel::SLUG, $slug)->first();

        if ($tenant) {
            return [$tenant, false];
        }

        $tenant = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => $slug,
            BusinessConfigModel::BUSINESS_NAME => $slug,
            BusinessConfigModel::TIPO_NEGOCIO => 'venta_por_peso',
            BusinessConfigModel::PRIMARY_COLOR => '#f59e0b',
            BusinessConfigModel::SIDEBAR_COLOR => '#1c1917',
            BusinessConfigModel::FONT_COLOR => '#ffffff',
            BusinessConfigModel::LABEL_COLOR => '#1c1917',
        ]);

        return [$tenant, true];
    }
}
