<?php

namespace Tests\Inventory;

use App\Enums\BusinessTypeEnum;
use App\Enums\RoleEnum;
use App\Enums\StockMovementReasonEnum;
use App\Enums\StockMovementTypeEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\RolePermission;
use App\Models\StockMovementModel;
use App\Models\User;
use Tests\TestCase;

/**
 * Kardex global del módulo de Inventario (Fase 4) — a diferencia del kardex por producto
 * (ProductStockMovementsTest), no exige ningún producto en la ruta: lista todo el historial
 * de stock_movements del tenant, con filtros opcionales. Exclusivo de negocios retail con
 * stock_enabled (ver RetailStockMiddleware) y permiso manageStock.
 */
class KardexTest extends TestCase
{
    private function marcarComoRetailConStock(bool $stockEnabled = true): void
    {
        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value,
            BusinessConfigModel::STOCK_ENABLED => $stockEnabled,
        ]);
    }

    private function crearUsuario(RoleEnum $rol): User
    {
        return User::factory()->create([
            User::ROL_ID => $rol->value,
            User::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function otorgarPermiso(int $roleId, string $key): void
    {
        $permission = Permission::where(Permission::KEY, $key)->firstOrFail();

        RolePermission::create([
            RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
            RolePermission::ROLE_ID => $roleId,
            RolePermission::PERMISSION_ID => $permission->id,
        ]);
    }

    private function crearProducto(): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE => 'Producto retail',
            ProductModel::PRECIO => 20,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::MANAGE_STOCK => true,
            ProductModel::STOCK => 10,
        ]);
    }

    private function crearMovimiento(
        ProductModel $product,
        StockMovementTypeEnum $type,
        StockMovementReasonEnum $reason,
        float $quantity = 1,
        ?\Carbon\Carbon $createdAt = null,
    ): StockMovementModel {
        $movement = StockMovementModel::create([
            StockMovementModel::PRODUCT_ID => $product->id,
            StockMovementModel::TYPE => $type,
            StockMovementModel::QUANTITY => $quantity,
            StockMovementModel::STOCK_BEFORE => 10,
            StockMovementModel::STOCK_AFTER => 10 + $quantity,
            StockMovementModel::REASON => $reason,
            StockMovementModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        if ($createdAt) {
            $movement->created_at = $createdAt;
            $movement->save();
        }

        return $movement;
    }

    public function test_lista_movimientos_de_varios_productos_sin_exigir_producto_en_la_ruta(): void
    {
        $this->marcarComoRetailConStock();
        $productA = $this->crearProducto();
        $productB = $this->crearProducto();
        $this->crearMovimiento($productA, StockMovementTypeEnum::Entry, StockMovementReasonEnum::ManualAdjustment);
        $this->crearMovimiento($productB, StockMovementTypeEnum::Exit, StockMovementReasonEnum::Sale);

        $this->getJson('/api/kardex', $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonCount(2, 'data');
    }

    public function test_filtra_por_product_id(): void
    {
        $this->marcarComoRetailConStock();
        $productA = $this->crearProducto();
        $productB = $this->crearProducto();
        $this->crearMovimiento($productA, StockMovementTypeEnum::Entry, StockMovementReasonEnum::ManualAdjustment);
        $this->crearMovimiento($productB, StockMovementTypeEnum::Exit, StockMovementReasonEnum::Sale);

        $this->getJson("/api/kardex?product_id={$productA->id}", $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.product_id', $productA->id);
    }

    public function test_filtra_por_type(): void
    {
        $this->marcarComoRetailConStock();
        $product = $this->crearProducto();
        $this->crearMovimiento($product, StockMovementTypeEnum::Entry, StockMovementReasonEnum::ManualAdjustment);
        $this->crearMovimiento($product, StockMovementTypeEnum::Exit, StockMovementReasonEnum::Sale);

        $this->getJson('/api/kardex?type='.StockMovementTypeEnum::Exit->value, $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', StockMovementTypeEnum::Exit->value);
    }

    public function test_filtra_por_reason(): void
    {
        $this->marcarComoRetailConStock();
        $product = $this->crearProducto();
        $this->crearMovimiento($product, StockMovementTypeEnum::Entry, StockMovementReasonEnum::Return);
        $this->crearMovimiento($product, StockMovementTypeEnum::Exit, StockMovementReasonEnum::Sale);

        $this->getJson('/api/kardex?reason='.StockMovementReasonEnum::Return->value, $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.reason', StockMovementReasonEnum::Return->value);
    }

    public function test_filtra_por_rango_de_fechas(): void
    {
        $this->marcarComoRetailConStock();
        $product = $this->crearProducto();
        $this->crearMovimiento(
            $product,
            StockMovementTypeEnum::Entry,
            StockMovementReasonEnum::ManualAdjustment,
            createdAt: now()->subDays(10)
        );
        $reciente = $this->crearMovimiento(
            $product,
            StockMovementTypeEnum::Entry,
            StockMovementReasonEnum::ManualAdjustment,
            createdAt: now()
        );

        $this->getJson('/api/kardex?fecha_desde='.now()->subDay()->toDateString().'&fecha_hasta='.now()->toDateString(), $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $reciente->id);
    }

    public function test_movimientos_ordenados_mas_reciente_primero(): void
    {
        $this->marcarComoRetailConStock();
        $product = $this->crearProducto();
        $this->crearMovimiento(
            $product,
            StockMovementTypeEnum::Entry,
            StockMovementReasonEnum::ManualAdjustment,
            createdAt: now()->subDay()
        );
        $reciente = $this->crearMovimiento($product, StockMovementTypeEnum::Exit, StockMovementReasonEnum::Sale);

        $response = $this->getJson('/api/kardex', $this->authHeaders())->assertStatus(206);

        $this->assertEquals($reciente->id, $response->json('data.0.id'));
    }

    public function test_no_incluye_movimientos_de_otro_tenant(): void
    {
        $this->marcarComoRetailConStock();
        $product = $this->crearProducto();
        $this->crearMovimiento($product, StockMovementTypeEnum::Entry, StockMovementReasonEnum::ManualAdjustment);

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

        StockMovementModel::create([
            StockMovementModel::PRODUCT_ID => $product->id,
            StockMovementModel::TYPE => StockMovementTypeEnum::Entry,
            StockMovementModel::QUANTITY => 99,
            StockMovementModel::STOCK_BEFORE => 0,
            StockMovementModel::STOCK_AFTER => 99,
            StockMovementModel::REASON => StockMovementReasonEnum::ManualAdjustment,
            StockMovementModel::TENANT_ID => $tenantB->id,
        ]);

        $this->getJson('/api/kardex', $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonCount(1, 'data');
    }

    public function test_negocio_no_retail_no_puede_ver_el_kardex(): void
    {
        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante->value,
            BusinessConfigModel::STOCK_ENABLED => true,
        ]);

        $this->getJson('/api/kardex', $this->authHeaders())->assertStatus(403);
    }

    public function test_retail_sin_stock_enabled_no_puede_ver_el_kardex(): void
    {
        $this->marcarComoRetailConStock(stockEnabled: false);

        $this->getJson('/api/kardex', $this->authHeaders())->assertStatus(403);
    }

    public function test_rol_sin_manage_stock_no_puede_ver_el_kardex(): void
    {
        $this->marcarComoRetailConStock();
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'payOrder');
        $caja = $this->crearUsuario(RoleEnum::CAJA);

        $this->getJson('/api/kardex', $this->authHeaders($caja))->assertStatus(403);
    }

    public function test_rol_con_manage_stock_puede_ver_el_kardex(): void
    {
        $this->marcarComoRetailConStock();
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'manageStock');
        $caja = $this->crearUsuario(RoleEnum::CAJA);

        $this->getJson('/api/kardex', $this->authHeaders($caja))->assertStatus(206);
    }

    public function test_sin_autenticacion_no_accede(): void
    {
        $this->marcarComoRetailConStock();

        $this->getJson('/api/kardex')->assertStatus(401);
    }
}
