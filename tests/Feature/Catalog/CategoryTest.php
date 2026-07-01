<?php

namespace Tests\Feature\Catalog;

use App\Models\CategoryModel;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    // ── Index ────────────────────────────────────────────────

    public function test_lista_categorias_paginada(): void
    {
        // successDataTable retorna HTTP 206 (PartialContent)
        $this->getJson('/api/category?page=1&limit=5', $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonStructure(['current_page', 'data', 'total', 'per_page']);
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
            ->assertJsonPath('data.icon_name', 'Coffee');

        $this->assertDatabaseHas('categories', ['nombre' => 'Nueva Categoría']);
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
            'icon_name' => 'Star',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.nombre', 'Nombre Actualizado');

        $this->assertDatabaseHas('categories', ['nombre' => 'Nombre Actualizado']);
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

    // ── CategoryProduct ──────────────────────────────────────

    public function test_lista_productos_de_categoria(): void
    {
        $category = CategoryModel::first();

        $this->getJson("/api/category/{$category->id}/product", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['status', 'data']);
    }
}
