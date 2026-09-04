<?php

namespace Tests\Feature;

use App\Models\BusinessConfigModel;
use Database\Seeders\BusinessConfigSeeder;
use Tests\TestCase;

/**
 * Cubre un bug real de producción: BusinessConfigSeeder corre en CADA arranque del
 * contenedor (docker/php/laravel_setup.sh), no solo en el primer deploy. Si el tenant
 * default fue borrado (soft-delete), las queries de existencia dejaban de "verlo" y el
 * firstOrCreate intentaba insertarlo de nuevo, chocando con el unique de `slug` a nivel
 * de BD — el seeder debe usar withTrashed() para no romperse en ese escenario.
 */
class BusinessConfigSeederTest extends TestCase
{
    public function test_no_falla_si_el_tenant_default_esta_soft_deleted(): void
    {
        $slug = config('tenant.default_slug');
        $tenant = BusinessConfigModel::where('slug', $slug)->firstOrFail();
        $tenant->delete();

        $this->assertSoftDeleted($tenant);

        (new BusinessConfigSeeder)->run();

        $this->assertDatabaseCount('business_config', BusinessConfigModel::withTrashed()->count());
        $this->assertSoftDeleted($tenant);
    }

    public function test_es_idempotente_si_el_tenant_ya_existe(): void
    {
        $countAntes = BusinessConfigModel::withTrashed()->count();

        (new BusinessConfigSeeder)->run();
        (new BusinessConfigSeeder)->run();

        $this->assertEquals($countAntes, BusinessConfigModel::withTrashed()->count());
    }

    public function test_asigna_slug_a_tenant_sin_slug_de_una_migracion_previa(): void
    {
        $slug = config('tenant.default_slug');
        BusinessConfigModel::where('slug', $slug)->firstOrFail()->update(['slug' => null]);

        (new BusinessConfigSeeder)->run();

        $this->assertDatabaseHas('business_config', ['slug' => $slug]);
    }
}
