<?php

namespace Tests\Catalog;

use App\Enums\IconSourceEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    private function crearCategoria(string $nombre, ?int $tenantId = null): CategoryModel
    {
        return CategoryModel::factory()->create([
            CategoryModel::NOMBRE => $nombre,
            CategoryModel::TENANT_ID => $tenantId ?? BusinessConfigModel::first()->id,
        ]);
    }

    // ── Index ────────────────────────────────────────────────

    public function test_lista_categorias_paginada(): void
    {
        // successDataTable retorna HTTP 206 (PartialContent)
        $this->getJson('/api/category?page=1&limit=5', $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonStructure(['current_page', 'data', 'total', 'per_page']);
    }

    // ── Index: búsqueda ──────────────────────────────────────

    public function test_busca_categoria_por_nombre(): void
    {
        $this->crearCategoria('Alpha Xyzzy');
        $this->crearCategoria('Beta Xyzzy');

        $response = $this->getJson('/api/category?search=Alpha Xyzzy&limit=100', $this->authHeaders())
            ->assertStatus(206);

        $this->assertSame(['Alpha Xyzzy'], array_column($response->json('data'), 'nombre'));
        $this->assertSame(1, $response->json('total'));
    }

    public function test_busqueda_de_categoria_es_parcial_y_no_distingue_mayusculas(): void
    {
        $this->crearCategoria('Alpha Xyzzy');

        $response = $this->getJson('/api/category?search=lpha XYZ&limit=100', $this->authHeaders())
            ->assertStatus(206);

        $this->assertSame(['Alpha Xyzzy'], array_column($response->json('data'), 'nombre'));
    }

    public function test_busqueda_de_categoria_sin_coincidencias_retorna_vacio(): void
    {
        $this->crearCategoria('Alpha Xyzzy');

        $response = $this->getJson('/api/category?search=NoExisteJamas&limit=100', $this->authHeaders())
            ->assertStatus(206);

        $this->assertSame([], $response->json('data'));
        $this->assertSame(0, $response->json('total'));
    }

    public function test_lista_de_categorias_sin_search_no_filtra(): void
    {
        $this->crearCategoria('Alpha Xyzzy');
        $this->crearCategoria('Beta Xyzzy');

        $response = $this->getJson('/api/category?limit=100', $this->authHeaders())
            ->assertStatus(206);

        $nombres = array_column($response->json('data'), 'nombre');
        $this->assertContains('Alpha Xyzzy', $nombres);
        $this->assertContains('Beta Xyzzy', $nombres);
    }

    public function test_busqueda_de_categoria_respeta_la_paginacion(): void
    {
        foreach (['Gamma Xyzzy 1', 'Gamma Xyzzy 2', 'Gamma Xyzzy 3'] as $nombre) {
            $this->crearCategoria($nombre);
        }

        $response = $this->getJson('/api/category?search=Gamma Xyzzy&limit=2&page=2', $this->authHeaders())
            ->assertStatus(206);

        $this->assertSame(3, $response->json('total'));
        $this->assertSame(2, $response->json('current_page'));
        $this->assertCount(1, $response->json('data'));
    }

    public function test_busqueda_de_categoria_no_incluye_categorias_de_otro_tenant(): void
    {
        $this->crearCategoria('Alpha Xyzzy');

        $tenantB = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'tenant-b-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Tenant B',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'lifetime',
        ]);
        $this->crearCategoria('Alpha Xyzzy Ajena', $tenantB->id);

        $response = $this->getJson('/api/category?search=Xyzzy&limit=100', $this->authHeaders())
            ->assertStatus(206);

        $this->assertSame(['Alpha Xyzzy'], array_column($response->json('data'), 'nombre'));
        $this->assertSame(1, $response->json('total'));
    }

    public function test_busqueda_de_categoria_requiere_autenticacion(): void
    {
        $this->getJson('/api/category?search=Alpha')
            ->assertStatus(401);
    }

    // ── Store ────────────────────────────────────────────────

    public function test_crea_categoria(): void
    {
        $response = $this->postJson('/api/category', [
            'nombre' => 'Nueva Categoría',
            'orden' => 5,
            'icon_name' => 'Coffee',
        ], $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.nombre', 'Nueva Categoría')
            ->assertJsonPath('data.icon_name', 'Coffee')
            ->assertJsonPath('data.icon_source', IconSourceEnum::Lucide->value);

        $this->assertDatabaseHas('categories', [
            'nombre' => 'Nueva Categoría',
            'icon_source' => IconSourceEnum::Lucide->value,
        ]);
    }

    public function test_crea_categoria_con_icono_openmoji(): void
    {
        $response = $this->postJson('/api/category', [
            'nombre' => 'Carnes',
            'orden' => 1,
            'icon_name' => '1F969',
            'icon_source' => IconSourceEnum::Openmoji->value,
        ], $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.icon_name', '1F969')
            ->assertJsonPath('data.icon_source', IconSourceEnum::Openmoji->value);

        $this->assertDatabaseHas('categories', [
            'nombre' => 'Carnes',
            'icon_name' => '1F969',
            'icon_source' => IconSourceEnum::Openmoji->value,
        ]);
    }

    public function test_no_crea_categoria_con_icon_source_invalido(): void
    {
        $this->postJson('/api/category', [
            'nombre' => 'Categoría Inválida',
            'icon_source' => 'invalido',
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_categoria_con_nombre_duplicado(): void
    {
        $existing = CategoryModel::first();

        // Violación de unique → ValidationException → 400
        $this->postJson('/api/category', [
            'nombre' => $existing->nombre,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_categoria_sin_nombre(): void
    {
        // Campo requerido faltante → ValidationException → 400
        $this->postJson('/api/category', [], $this->authHeaders())
            ->assertStatus(400);
    }

    // ── Show ─────────────────────────────────────────────────

    public function test_muestra_categoria(): void
    {
        $category = CategoryModel::first();

        $this->getJson("/api/category/{$category->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.id', $category->id);
    }

    // ── Update ───────────────────────────────────────────────

    public function test_actualiza_categoria(): void
    {
        $category = CategoryModel::first();

        $this->putJson("/api/category/{$category->id}", [
            'nombre' => 'Nombre Actualizado',
            'orden' => 2,
            'icon_name' => '1F955',
            'icon_source' => IconSourceEnum::Openmoji->value,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.nombre', 'Nombre Actualizado')
            ->assertJsonPath('data.icon_source', IconSourceEnum::Openmoji->value);

        $this->assertDatabaseHas('categories', [
            'nombre' => 'Nombre Actualizado',
            'icon_name' => '1F955',
            'icon_source' => IconSourceEnum::Openmoji->value,
        ]);
    }

    public function test_actualiza_categoria_con_mismo_nombre(): void
    {
        $category = CategoryModel::first();

        // ?? '' porque SQLite aplica NOT NULL en icon_name y las categorías
        // sembradas sin icon_name explícito pueden retornar null en el modelo
        $this->putJson("/api/category/{$category->id}", [
            'nombre' => $category->nombre,
            'orden' => $category->orden ?? 1,
            'icon_name' => $category->icon_name ?? '',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_actualiza_categoria_permite_quitar_el_icono(): void
    {
        $category = CategoryModel::first();
        $category->update(['icon_name' => 'Tag']);

        $this->putJson("/api/category/{$category->id}", [
            'nombre' => $category->nombre,
            'orden' => $category->orden ?? 1,
            'icon_name' => '',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.icon_name', '');

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'icon_name' => '',
        ]);
    }

    // ── Delete ───────────────────────────────────────────────

    public function test_elimina_categoria(): void
    {
        $category = CategoryModel::create([
            'nombre' => 'Para Eliminar',
            'orden' => 99,
            'icon_name' => 'Trash',
        ]);

        $this->deleteJson("/api/category/{$category->id}", [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertSoftDeleted('categories', ['id' => $category->id]);
    }

    // ── List (simple, cacheada) ──────────────────────────────

    public function test_lista_categorias_simple(): void
    {
        $response = $this->getJson('/api/category/list', $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['status', 'data' => [['id', 'nombre']]]);
    }

    public function test_lista_categorias_simple_retorna_array(): void
    {
        $response = $this->getJson('/api/category/list', $this->authHeaders());
        $this->assertIsArray($response->json('data'));
        $this->assertNotEmpty($response->json('data'));
    }

    // ── CategoryProduct ──────────────────────────────────────

    public function test_lista_productos_de_categoria(): void
    {
        $category = CategoryModel::first();

        $this->getJson("/api/category/{$category->id}/product", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['status', 'data']);
    }

    public function test_categoria_inexistente_retorna_404(): void
    {
        $this->getJson('/api/category/99999', $this->authHeaders())
            ->assertStatus(404);
    }
}
