<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // BusinessConfig debe correr primero (los demás seeders dependen de tenant_id=1)
        $this->call(BusinessConfigSeeder::class);
        $this->call(CategoriesSeeder::class);
        $this->call(OrderStatusSeeder::class);
        $this->call(RoleSeeder::class);
        $this->call(UserSeeder::class);
    }
}
