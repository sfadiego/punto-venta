<?php

use App\Enums\UnidadMedidaEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->changeEnumValues(array_column(UnidadMedidaEnum::cases(), 'value'));
    }

    public function down(): void
    {
        $this->changeEnumValues(['unidad', 'kg', 'gr']);
    }

    /**
     * SQLite implementa `enum` como `varchar` + `CHECK`, sin soporte para ALTER
     * COLUMN — hay que recrear la tabla con el CHECK actualizado (mismo patrón
     * usado en 2026_06_23_231134_add_extras_to_order_product.php). Se lee el
     * CREATE TABLE original vía sqlite_master en vez de hardcodear el esquema
     * completo del producto, para no arriesgar divergencias con columnas que no
     * son parte de este cambio.
     */
    private function changeEnumValues(array $values): void
    {
        $quoted = implode(',', array_map(fn (string $value) => "'{$value}'", $values));

        if (DB::connection()->getDriverName() === 'sqlite') {
            $original = DB::selectOne("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'product'")->sql;
            $updated = preg_replace(
                '/check \("unidad_medida" in \([^)]*\)\)/i',
                "check (\"unidad_medida\" in ({$quoted}))",
                $original,
            );

            DB::statement('PRAGMA foreign_keys = OFF');
            // Sin esto, RENAME TO reescribe automáticamente el REFERENCES "product"
            // de otras tablas (ej. order_product) apuntando a "product_tmp", que
            // luego se elimina y deja el FK apuntando a una tabla inexistente.
            DB::statement('PRAGMA legacy_alter_table = ON');
            DB::statement('ALTER TABLE product RENAME TO product_tmp');
            DB::statement($updated);
            DB::statement('INSERT INTO product SELECT * FROM product_tmp');
            DB::statement('DROP TABLE product_tmp');
            DB::statement('PRAGMA legacy_alter_table = OFF');
            DB::statement('PRAGMA foreign_keys = ON');

            return;
        }

        DB::statement("ALTER TABLE product MODIFY unidad_medida ENUM({$quoted}) NOT NULL DEFAULT '".UnidadMedidaEnum::Unidad->value."'");
    }
};
