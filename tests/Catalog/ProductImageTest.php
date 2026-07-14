<?php

namespace Tests\Catalog;

use App\Models\BusinessConfigModel;
use App\Models\ProductImageModel;
use App\Models\ProductModel;
use Tests\TestCase;

class ProductImageTest extends TestCase
{
    private function crearProducto(): ProductModel
    {
        return ProductModel::factory()->create([
            'tenant_id' => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearImagen(): ProductImageModel
    {
        return ProductImageModel::create([
            ProductImageModel::NOMBRE_ARCHIVO => 'slug-test/old_image.jpg',
            ProductImageModel::URL => 'private/slug-test/old_image.jpg',
        ]);
    }

    public function test_no_sube_imagen_sin_autenticacion(): void
    {
        $product = $this->crearProducto();

        $this->postJson("/api/product/{$product->id}/image", [])
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

    public function test_no_actualiza_imagen_sin_autenticacion(): void
    {
        $product = $this->crearProducto();
        $image = $this->crearImagen();

        $this->postJson(
            "/api/product/{$product->id}/image/{$image->id}",
            []
        )->assertStatus(401);
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
