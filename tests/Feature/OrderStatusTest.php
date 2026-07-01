<?php

namespace Tests\Feature;

use App\Models\OrderStatusModel;
use Tests\TestCase;

class OrderStatusTest extends TestCase
{
    // ── Index ────────────────────────────────────────────────

    public function test_lista_statuses(): void
    {
        $this->getJson('/api/order-status', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['status', 'data']);
    }

    // ── Show ─────────────────────────────────────────────────

    public function test_muestra_status(): void
    {
        $status = OrderStatusModel::first();

        $this->getJson("/api/order-status/{$status->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.id', $status->id);
    }

    // ── Auth ─────────────────────────────────────────────────

    public function test_sin_token_no_accede(): void
    {
        $this->getJson('/api/order-status')->assertStatus(401);
    }
}
