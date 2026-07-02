<?php

namespace Tests\Feature\Catalog;

use App\Models\CategoryModel;
use App\Models\ProductImageModel;
use App\Models\ProductModel;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductImageTest extends TestCase
{
    private function crearProducto(): ProductModel
    {
        $response = $this->postJson('/api/product', [
            'nombre' => 'Café Test',
            'precio' => 35,
            'categoria_id' => CategoryModel::first()->id,
        ], $this->authHeaders());

        return ProductModel::find($response->json('data.id'));
    }

    private function crearImagen(): ProductImageModel
    {
        return ProductImageModel::create([
            ProductImageModel::NOMBRE_ARCHIVO => 'slug-test/old_image.jpg',
            ProductImageModel::URL => 'private/slug-test/old_image.jpg',
        ]);
    }

    // ── Store ─────────────────────────────────────────────────

    public function test_sube_imagen_de_producto(): void
    {
        Storage::fake('local');

        $product = $this->crearProducto();
        $file = UploadedFile::fake()->image('foto.jpg');

        $response = $this->postJson(
            "/api/product/{$product->id}/image",
            ['file' => $file],
            $this->authHeaders()
        );

        $response->assertStatus(200)
            ->assertJsonPath('id', $product->id);

        $this->assertDatabaseMissing('product', [
            'id' => $product->id,
            'foto_id' => null,
        ]);
    }

    public function test_no_sube_imagen_sin_autenticacion(): void
    {
        $this->postJson('/api/product/1/image', [])
            ->assertStatus(401);
    }

    public function test_no_sube_imagen_sin_archivo(): void
    {
        $product = $this->crearProducto();

        $this->postJson(
            "/api/product/{$product->id}/image",
            [],
            $this->authHeaders()
        )->assertStatus(400);
    }

    // ── Update ────────────────────────────────────────────────

    public function test_actualiza_imagen_de_producto(): void
    {
        Storage::fake('local');

        $product = $this->crearProducto();
        $image = $this->crearImagen();
        $product->foto_id = $image->id;
        $product->save();

        $file = UploadedFile::fake()->image('nueva.jpg');

        $response = $this->postJson(
            "/api/product/{$product->id}/image/{$image->id}",
            ['file' => $file],
            $this->authHeaders()
        );

        $response->assertStatus(200)
            ->assertJsonPath('id', $product->id);
    }

    public function test_no_actualiza_imagen_sin_autenticacion(): void
    {
        $this->postJson('/api/product/1/image/1', [])
            ->assertStatus(401);
    }

    public function test_no_actualiza_imagen_sin_archivo(): void
    {
        $product = $this->crearProducto();
        $image = $this->crearImagen();

        $this->postJson(
            "/api/product/{$product->id}/image/{$image->id}",
            [],
            $this->authHeaders()
        )->assertStatus(400);
    }
}
