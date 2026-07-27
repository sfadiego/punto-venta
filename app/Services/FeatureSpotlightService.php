<?php

namespace App\Services;

use App\Enums\FeatureSpotlightEnum;
use App\Models\FeatureSpotlightSeen;

class FeatureSpotlightService
{
    public function seenKeysForUser(int $userId): array
    {
        return FeatureSpotlightSeen::where(FeatureSpotlightSeen::USER_ID, $userId)
            ->pluck(FeatureSpotlightSeen::FEATURE_KEY)
            ->all();
    }

    /** Idempotente: marcar el mismo feature visto varias veces no crea duplicados. */
    public function markSeen(int $userId, int $tenantId, string $key): void
    {
        FeatureSpotlightSeen::firstOrCreate(
            [
                FeatureSpotlightSeen::USER_ID => $userId,
                FeatureSpotlightSeen::FEATURE_KEY => $key,
            ],
            [
                FeatureSpotlightSeen::TENANT_ID => $tenantId,
                FeatureSpotlightSeen::SEEN_AT => now(),
            ],
        );
    }

    /** Features marcados por el SuperAdmin como "ya no relevantes" para todo el tenant (user_id nulo). */
    public function disabledKeysForTenant(int $tenantId): array
    {
        return FeatureSpotlightSeen::where(FeatureSpotlightSeen::TENANT_ID, $tenantId)
            ->whereNull(FeatureSpotlightSeen::USER_ID)
            ->pluck(FeatureSpotlightSeen::FEATURE_KEY)
            ->all();
    }

    /** Checklist para el SuperAdmin: todos los features conocidos + si están habilitados para el tenant. */
    public function checklistForTenant(int $tenantId): array
    {
        $disabled = $this->disabledKeysForTenant($tenantId);

        return array_map(fn (FeatureSpotlightEnum $case) => [
            'key' => $case->value,
            'enabled' => ! in_array($case->value, $disabled, true),
        ], FeatureSpotlightEnum::cases());
    }

    /** Reemplaza los features deshabilitados de un tenant por el complemento de $enabledKeys. */
    public function syncTenantEnabled(int $tenantId, array $enabledKeys): void
    {
        $allKeys = array_map(fn (FeatureSpotlightEnum $case) => $case->value, FeatureSpotlightEnum::cases());
        $disabledKeys = array_values(array_diff($allKeys, $enabledKeys));

        FeatureSpotlightSeen::where(FeatureSpotlightSeen::TENANT_ID, $tenantId)
            ->whereNull(FeatureSpotlightSeen::USER_ID)
            ->delete();

        $rows = array_map(fn (string $key) => [
            FeatureSpotlightSeen::TENANT_ID => $tenantId,
            FeatureSpotlightSeen::USER_ID => null,
            FeatureSpotlightSeen::FEATURE_KEY => $key,
            FeatureSpotlightSeen::SEEN_AT => now(),
        ], $disabledKeys);

        if ($rows !== []) {
            FeatureSpotlightSeen::insert($rows);
        }
    }
}
