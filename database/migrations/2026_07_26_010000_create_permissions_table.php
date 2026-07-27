<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Catálogo fijo de acciones — debe reflejar 1:1 el tipo `Action` de
    // resources/js/hooks/usePermissions.ts. Solo se agrega/quita vía migración.
    private const CATALOG = [
        ['key' => 'viewDashboard', 'label' => 'Ver dashboard'],
        ['key' => 'viewOrders', 'label' => 'Ver órdenes'],
        ['key' => 'viewProducts', 'label' => 'Ver productos'],
        ['key' => 'viewCategories', 'label' => 'Ver categorías'],
        ['key' => 'viewSales', 'label' => 'Ver ventas (histórico)'],
        ['key' => 'viewStatistics', 'label' => 'Ver estadísticas'],
        ['key' => 'viewAdmin', 'label' => 'Ver panel de administración'],
        ['key' => 'viewCloseSales', 'label' => 'Ver cierre de caja'],
        ['key' => 'takeOrder', 'label' => 'Tomar pedidos'],
        ['key' => 'payOrder', 'label' => 'Cobrar ventas'],
        ['key' => 'deleteOrder', 'label' => 'Eliminar órdenes'],
        ['key' => 'editOrderName', 'label' => 'Editar nombre/datos de la orden'],
        ['key' => 'printTicket', 'label' => 'Imprimir ticket'],
        ['key' => 'kitchenView', 'label' => 'Vista de cocina'],
        ['key' => 'managePendingOrders', 'label' => 'Gestionar órdenes pendientes'],
        ['key' => 'viewUsers', 'label' => 'Ver usuarios'],
        ['key' => 'viewCustomers', 'label' => 'Ver clientes'],
        ['key' => 'registerExpense', 'label' => 'Registrar gastos'],
    ];

    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('label');
            $table->timestamps();
        });

        $now = now();
        DB::table('permissions')->insert(array_map(
            fn (array $row) => [...$row, 'created_at' => $now, 'updated_at' => $now],
            self::CATALOG,
        ));
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};
