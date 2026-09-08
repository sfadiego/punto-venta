<?php

namespace Tests\Inventory;

use App\Enums\BusinessTypeEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\RolePermission;
use App\Models\User;
use Tests\TestCase;

/**
 * Fase 5 del plan de Inventario: el reajuste manual de stock (POST /product/{id}/stock-
 * adjustment) es un endpoint compartido entre dos flujos de UI legítimos — Productos
 * (viewProducts, venta_por_peso/restaurante) y la página de Inventario retail (manageStock).
 * Ninguno de los dos permisos por sí solo debe ser obligatorio para el otro flujo (patrón OR,
 * ver CLAUDE.md "permission:xxx,yyy"). El soporte de delta negativo en el backend ya estaba
 * cubierto por ProductStockAdjustmentTest — aquí solo se cubre la nueva superficie de permisos.
 */
class StockAdjustmentPermissionTest extends TestCase
{
    private function marcarComoRetailConStock(): void
    {
        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value,
            BusinessConfigModel::STOCK_ENABLED => true,
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

    private function crearProductoConStock(float $stock = 10): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE => 'Producto retail',
            ProductModel::PRECIO => 20,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::MANAGE_STOCK => true,
            ProductModel::STOCK => $stock,
        ]);
    }

    public function test_manage_stock_sin_view_products_puede_ajustar_stock(): void
    {
        $this->marcarComoRetailConStock();
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'manageStock');
        $caja = $this->crearUsuario(RoleEnum::CAJA);
        $product = $this->crearProductoConStock(10);

        $this->postJson("/api/product/{$product->id}/stock-adjustment", [
            'delta' => -3,
        ], $this->authHeaders($caja))
            ->assertStatus(200)
            ->assertJsonPath('data.stock', '7.00');
    }

    public function test_view_products_sin_manage_stock_sigue_pudiendo_ajustar_stock(): void
    {
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewProducts');
        $employe = $this->crearUsuario(RoleEnum::EMPLOYE);
        $product = $this->crearProductoConStock(10);

        $this->postJson("/api/product/{$product->id}/stock-adjustment", [
            'delta' => 5,
        ], $this->authHeaders($employe))
            ->assertStatus(200)
            ->assertJsonPath('data.stock', '15.00');
    }

    public function test_rol_sin_ninguno_de_los_dos_permisos_no_puede_ajustar_stock(): void
    {
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'payOrder');
        $caja = $this->crearUsuario(RoleEnum::CAJA);
        $product = $this->crearProductoConStock(10);

        $this->postJson("/api/product/{$product->id}/stock-adjustment", [
            'delta' => 5,
        ], $this->authHeaders($caja))->assertStatus(403);
    }

    public function test_stock_movements_por_producto_sigue_exigiendo_solo_view_products(): void
    {
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'manageStock');
        $caja = $this->crearUsuario(RoleEnum::CAJA);
        $product = $this->crearProductoConStock(10);

        $this->getJson("/api/product/{$product->id}/stock-movements", $this->authHeaders($caja))
            ->assertStatus(403);
    }
}
