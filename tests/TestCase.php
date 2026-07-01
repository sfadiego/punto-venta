<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    protected function authHeaders(?User $user = null): array
    {
        $user ??= User::where('rol_id', 1)->first();
        $token = $user->createToken('test')->plainTextToken;

        return ['Authorization' => "Bearer $token"];
    }
}
