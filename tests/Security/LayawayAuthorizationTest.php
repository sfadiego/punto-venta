<?php

namespace Tests\Security;

use App\Enums\BusinessTypeEnum;
use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\CustomerModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\PaymentMethodModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\RolePermission;
use App\Models\User;
use App\Services\RolePermissionService;
use Tests\TestCase;

/**
 * Permiso `layaway` (apartados, solo retail): Admin siempre pasa; Caja lo trae por defecto; un
 * rol configurado explícitamente sin el permiso no puede apartar, abonar ni cancelar.
 */
class LayawayAuthorizationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value]);
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
        RolePermission::create([
            RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
            RolePermission::ROLE_ID => $roleId,
            RolePermission::PERMISSION_ID => Permission::where(Permission::KEY, $key)->firstOrFail()->id,
        ]);
    }

    private function crearCaja(): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearOrden(MainOrderReportModel $caja): OrderModel
    {
        $order = OrderModel::create([
            OrderModel::TOTAL => 1000,
            OrderModel::SUBTOTAL => 1000,
            OrderModel::DESCUENTO => 0,
            OrderModel::NOMBRE_PEDIDO => 'Venta apartado',
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS->value,
            OrderModel::SISTEMA_ID => $caja->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        $product = ProductModel::create([
            ProductModel::NOMBRE => 'Juguete',
            ProductModel::PRECIO => 1000,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
        ]);

        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $order->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 1000,
            OrderProductModel::DESCUENTO => 0,
        ]);

        return $order;
    }

    private function payload(MainOrderReportModel $caja): array
    {
        return [
            'customer_id' => CustomerModel::create([
                CustomerModel::NAME => 'Cliente '.uniqid(),
                CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
            ])->id,
            'amount' => 100,
            'payment_method_id' => PaymentMethodModel::first()->id,
            'sistema_id' => $caja->id,
        ];
    }

    public function test_rol_con_permiso_layaway_otorgado_puede_apartar(): void
    {
        $caja = $this->crearCaja();
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'layaway');
        $order = $this->crearOrden($caja);

        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($caja), $this->authHeaders($empleado))
            ->assertStatus(200);
    }

    public function test_rol_configurado_sin_permiso_layaway_no_puede_apartar_abonar_ni_cancelar(): void
    {
        $caja = $this->crearCaja();
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        // Configurado con otro permiso cualquiera, para no caer en el fallback a DEFAULTS.
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'takeOrder');
        $order = $this->crearOrden($caja);
        $headers = $this->authHeaders($empleado);

        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($caja), $headers)->assertStatus(403);
        $this->postJson("/api/order/{$order->id}/layaway/payment", ['amount' => 50], $headers)->assertStatus(403);
        $this->postJson("/api/order/{$order->id}/layaway/cancel", ['sistema_id' => $caja->id], $headers)->assertStatus(403);
        $this->getJson("/api/order/{$order->id}/layaway", $headers)->assertStatus(403);
    }

    public function test_caja_sin_configurar_hereda_layaway_por_defecto_en_retail(): void
    {
        $caja = $this->crearCaja();
        $cajero = $this->crearUsuario(RoleEnum::CAJA);
        $order = $this->crearOrden($caja);

        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($caja), $this->authHeaders($cajero))
            ->assertStatus(200);
    }

    public function test_layaway_no_es_default_en_tenants_que_no_son_retail(): void
    {
        $tenant = BusinessConfigModel::first();
        $tenant->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante->value]);
        $this->actingAs($this->crearUsuario(RoleEnum::CAJA));
        app()->instance('tenant_id', $tenant->id);

        $granted = app(RolePermissionService::class)->grantedKeys(RoleEnum::CAJA->value);

        $this->assertNotContains('layaway', $granted);
    }

    // En retail no existen los roles Caja ni Cocina: el Empleado es quien cobra, así que sin
    // configuración previa debe poder apartar (default de RolePermissionService::DEFAULTS).
    public function test_empleado_retail_sin_configurar_hereda_layaway_por_defecto(): void
    {
        $caja = $this->crearCaja();
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $order = $this->crearOrden($caja);

        $this->postJson("/api/order/{$order->id}/layaway", $this->payload($caja), $this->authHeaders($empleado))
            ->assertStatus(200);
    }

    // El permiso `layaway` se puede delegar desde "Roles y permisos" (existe en el catálogo).
    public function test_admin_puede_otorgar_layaway_desde_roles_y_permisos(): void
    {
        $this->putJson('/api/admin/role-permissions/'.RoleEnum::EMPLOYE->value, [
            'permissions' => ['viewOrders', 'layaway'],
        ], $this->authHeaders())
            ->assertStatus(200);

        $this->assertContains('layaway', app(RolePermissionService::class)->grantedKeys(RoleEnum::EMPLOYE->value));
    }
}
