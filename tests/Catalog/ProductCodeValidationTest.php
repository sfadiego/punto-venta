<?php

namespace Tests\Catalog;

use App\Models\CategoryModel;
use App\Models\ProductModel;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Validación del código de producto al crear/editar: solo lo que el generador de Code128 puede
 * dibujar (ASCII imprimible), con los espacios convertidos en guion. Un producto guardado antes
 * de esta validación con un código no válido se sigue pudiendo editar mientras su código no cambie.
 */
class ProductCodeValidationTest extends TestCase
{
    private const MENSAJE_CODIGO = 'El código de barras solo admite letras sin acento, números y símbolos comunes (sin acentos, ñ ni emojis).';

    /** @return array<string, array{string}> */
    public static function codigosNoPermitidos(): array
    {
        return [
            'acento' => ['CÓDIGO'],
            'eñe' => ['REG010ñn'],
            'emoji' => ['PRD🎉'],
            'carácter de control' => ["AB\x01C"],
        ];
    }

    private function crear(array $overrides = []): TestResponse
    {
        return $this->postJson('/api/product', array_merge([
            'nombre' => 'Producto '.uniqid(),
            'precio' => 100,
            'categoria_id' => CategoryModel::first()->id,
        ], $overrides), $this->authHeaders());
    }

    private function editar(ProductModel $product, array $overrides = []): TestResponse
    {
        return $this->putJson("/api/product/{$product->id}", array_merge([
            'nombre' => $product->nombre,
            'precio' => $product->precio,
            'categoria_id' => $product->categoria_id,
        ], $overrides), $this->authHeaders());
    }

    // ── Crear ────────────────────────────────────────────────

    public function test_crea_producto_con_codigo_valido(): void
    {
        $this->crear(['product_code' => 'JUG-001_x/2'])->assertStatus(200);

        $this->assertDatabaseHas('product', ['product_code' => 'JUG-001_x/2']);
    }

    #[DataProvider('codigosNoPermitidos')]
    public function test_no_crea_producto_con_codigo_no_permitido(string $code): void
    {
        $nombre = 'Producto '.uniqid();

        $this->crear(['nombre' => $nombre, 'product_code' => $code])
            ->assertStatus(400)
            ->assertJsonPath('data.product_code.0', self::MENSAJE_CODIGO);

        $this->assertDatabaseMissing('product', ['nombre' => $nombre]);
    }

    public function test_espacios_del_codigo_se_cambian_por_guion_al_crear(): void
    {
        $this->crear(['product_code' => '  REG   010 x  '])->assertStatus(200);

        $this->assertDatabaseHas('product', ['product_code' => 'REG-010-x']);
    }

    public function test_codigo_con_espacios_choca_con_el_normalizado_ya_existente(): void
    {
        ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'REG-010']);

        $this->crear(['product_code' => 'REG 010'])
            ->assertStatus(400)
            ->assertJsonPath('data.product_code.0', 'Ya existe un producto con este código de barras.');
    }

    public function test_sin_codigo_se_genera_uno_valido(): void
    {
        $response = $this->crear(['nombre' => 'Piñata con acento'])->assertStatus(200);

        $this->assertMatchesRegularExpression('/^[A-Z0-9]+$/', $response->json('data.product_code'));
    }

    // ── Editar ───────────────────────────────────────────────

    public function test_edita_producto_cambiando_a_un_codigo_valido(): void
    {
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'VIEJO1']);

        $this->editar($producto, ['product_code' => 'NUEVO1'])->assertStatus(200);

        $this->assertSame('NUEVO1', $producto->fresh()->product_code);
    }

    #[DataProvider('codigosNoPermitidos')]
    public function test_no_cambia_el_codigo_a_uno_no_permitido(string $code): void
    {
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'VIEJO1']);

        $this->editar($producto, ['product_code' => $code])
            ->assertStatus(400)
            ->assertJsonPath('data.product_code.0', self::MENSAJE_CODIGO);

        $this->assertSame('VIEJO1', $producto->fresh()->product_code);
    }

    public function test_producto_con_codigo_viejo_no_valido_se_edita_si_el_codigo_no_cambia(): void
    {
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'REG010ñń', ProductModel::PRECIO => 50]);

        $this->editar($producto, ['precio' => 75, 'product_code' => 'REG010ñń'])->assertStatus(200);

        $producto->refresh();
        $this->assertEquals(75, $producto->precio);
        $this->assertSame('REG010ñń', $producto->product_code);
    }

    public function test_codigo_viejo_con_espacios_que_no_cambia_no_se_normaliza(): void
    {
        // La etiqueta ya impresa lleva "REG 010": editar el precio no debe cambiar el código.
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'REG 010']);

        $this->editar($producto, ['precio' => 80, 'product_code' => 'REG 010'])->assertStatus(200);

        $this->assertSame('REG 010', $producto->fresh()->product_code);
    }

    public function test_codigo_viejo_no_valido_cambiado_a_otro_no_valido_se_rechaza(): void
    {
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'REG010ñń']);

        $this->editar($producto, ['product_code' => 'REG010ñ'])->assertStatus(400);

        $this->assertSame('REG010ñń', $producto->fresh()->product_code);
    }

    public function test_codigo_viejo_no_valido_se_corrige_a_uno_valido(): void
    {
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'REG010ñń']);

        $this->editar($producto, ['product_code' => 'REG 011'])->assertStatus(200);

        $this->assertSame('REG-011', $producto->fresh()->product_code);
    }

    public function test_codigo_viejo_no_valido_se_puede_borrar(): void
    {
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'REG010ñń']);

        $this->editar($producto, ['product_code' => ''])->assertStatus(200);

        $this->assertNull($producto->fresh()->product_code);
    }
}
