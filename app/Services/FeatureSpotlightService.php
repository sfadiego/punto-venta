<?php

namespace App\Services;

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
    public function markSeen(int $userId, string $key): void
    {
        FeatureSpotlightSeen::firstOrCreate(
            [
                FeatureSpotlightSeen::USER_ID => $userId,
                FeatureSpotlightSeen::FEATURE_KEY => $key,
            ],
            [
                FeatureSpotlightSeen::SEEN_AT => now(),
            ],
        );
    }
}
