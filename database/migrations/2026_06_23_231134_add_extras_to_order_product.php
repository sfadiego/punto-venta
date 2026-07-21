<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_product', function (Blueprint $table) {
            $table->string('nombre_extra')->nullable()->after('precio');
        });

        if (DB::connection()->getDriverName() === 'sqlite') {
            // SQLite cannot ALTER COLUMN; recreate with quoted "order" to avoid reserved-word error.
            DB::statement('PRAGMA foreign_keys = OFF');
            DB::statement('CREATE TABLE "order_product_tmp" AS SELECT * FROM "order_product"');
            DB::statement('DROP TABLE "order_product"');
            DB::statement('CREATE TABLE "order_product" (
                "id" integer primary key autoincrement not null,
                "producto_id" integer null,
                "pedido_id" integer not null,
                "descuento" integer default 0,
                "cantidad" integer not null,
                "precio" float not null,
                "nombre_extra" varchar null,
                "created_at" datetime,
                "updated_at" datetime,
                foreign key("pedido_id") references "order"("id"),
                foreign key("producto_id") references "product"("id")
            )');
            DB::statement('INSERT INTO "order_product" SELECT * FROM "order_product_tmp"');
            DB::statement('DROP TABLE "order_product_tmp"');
            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            Schema::table('order_product', function (Blueprint $table) {
                $table->unsignedBigInteger('producto_id')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        Schema::table('order_product', function (Blueprint $table) {
            $table->dropColumn('nombre_extra');
        });

        if (DB::connection()->getDriverName() !== 'sqlite') {
            Schema::table('order_product', function (Blueprint $table) {
                $table->unsignedBigInteger('producto_id')->nullable(false)->change();
            });
        }
    }
};
