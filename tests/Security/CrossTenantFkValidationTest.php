<?php

namespace Tests\Security;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\ProductImageModel;
use App\Models\ProductModel;
use App\Models\User;
use Tests\TestCase;

class CrossTenantFkValidationTest extends TestCase
{
    private function crearTenantB(): BusinessConfigModel
    {
        return BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'tenant-b-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Tenant B',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'lifetime',
        ]);
    }

    private function crearAdminParaTenant(int $tenantId): User
    {
        return User::create([
            User::NOMBRE => 'Admin',
            User::APELLIDO_PATERNO => 'B',
            User::APELLIDO_MATERNO => '',
            User::EMAIL => 'admin-b-'.uniqid().'@test.com',
            User::USUARIO => 'admin-b-'.uniqid(),
            User::PASSWORD => bcrypt('password123'),
            User::ROL_ID => RoleEnum::ADMIN->value,
            User::ACTIVO => true,
            User::TENANT_ID => $tenantId,
        ]);
    }

    public function test_no_se_puede_crear_producto_con_categoria_de_otro_tenant(): void
    {
        $tenantB = $this->crearTenantB();
        $categoryB = CategoryModel::create([
            CategoryModel::NOMBRE => 'Categoria B',
            CategoryModel::TENANT_ID => $tenantB->id,
        ]);

        $this->postJson('/api/product', [
            'nombre' => 'Producto Intruso',
            'precio' => 10,
            'categoria_id' => $categoryB->id,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_se_puede_asignar_imagen_de_otro_tenant_a_un_producto(): void
    {
        $tenantB = $this->crearTenantB();
        $imageB = ProductImageModel::create([
            'tenant_id' => $tenantB->id,
            ProductImageModel::NOMBRE_ARCHIVO => 'tenant-b/private_photo.jpg',
            ProductImageModel::URL => 'private/tenant-b/private_photo.jpg',
        ]);

        $this->postJson('/api/product', [
            'nombre' => 'Producto Con Foto Ajena',
            'precio' => 10,
            'categoria_id' => CategoryModel::first()->id,
            'picture_id' => $imageB->id,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_venta_directa_no_puede_referenciar_producto_de_otro_tenant(): void
    {
        $tenantB = $this->crearTenantB();
        $productB = ProductModel::create([
            ProductModel::NOMBRE => 'Producto B',
            ProductModel::PRECIO => 50,
            ProductModel::CATEGORIA_ID => CategoryModel::create([
                CategoryModel::NOMBRE => 'Categoria B',
                CategoryModel::TENANT_ID => $tenantB->id,
            ])->id,
            ProductModel::ACTIVO => true,
            ProductModel::TENANT_ID => $tenantB->id,
        ]);

        $report = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        $this->postJson('/api/order/sale', [
            'sistema_id' => $report->id,
            'nombre_pedido' => 'Venta Intrusa',
            'items' => [
                [
                    'producto_id' => $productB->id,
                    'cantidad' => 1,
                    'precio' => $productB->precio,
                ],
            ],
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_se_puede_agregar_producto_de_otro_tenant_a_una_orden(): void
    {
        $tenantB = $this->crearTenantB();
        $productB = ProductModel::create([
            ProductModel::NOMBRE => 'Producto B',
            ProductModel::PRECIO => 50,
            ProductModel::CATEGORIA_ID => CategoryModel::create([
                CategoryModel::NOMBRE => 'Categoria B',
                CategoryModel::TENANT_ID => $tenantB->id,
            ])->id,
            ProductModel::ACTIVO => true,
            ProductModel::TENANT_ID => $tenantB->id,
        ]);

        $report = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        $order = $this->postJson('/api/order', [
            'nombre_pedido' => 'Orden A',
            'sistema_id' => $report->id,
            'total' => 0,
            'subtotal' => 0,
            'estatus_pedido_id' => OrderStatusEnum::IN_PROCESS->value,
        ], $this->authHeaders())->json('data');

        $this->postJson("/api/order/{$order['id']}/product", [
            'producto_id' => $productB->id,
            'cantidad' => 1,
            'precio' => $productB->precio,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_se_puede_crear_orden_referenciando_caja_de_otro_tenant(): void
    {
        $tenantB = $this->crearTenantB();
        $reportB = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500,
            MainOrderReportModel::USER_ID => $this->crearAdminParaTenant($tenantB->id)->id,
            MainOrderReportModel::TENANT_ID => $tenantB->id,
        ]);

        $this->postJson('/api/order', [
            'nombre_pedido' => 'Orden Intrusa',
            'sistema_id' => $reportB->id,
            'total' => 0,
            'subtotal' => 0,
            'estatus_pedido_id' => OrderStatusEnum::IN_PROCESS->value,
        ], $this->authHeaders())
            ->assertStatus(400);
    }
}
