<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProviderModel extends Model
{
    use HasFactory, HasTenant, SoftDeletes;

    protected $table = 'providers';

    const NAME = 'name';

    const PHONE = 'phone';

    const CONTACT_NAME = 'contact_name';

    const NOTES = 'notes';

    const TENANT_ID = 'tenant_id';

    protected $fillable = [
        self::NAME,
        self::PHONE,
        self::CONTACT_NAME,
        self::NOTES,
        self::TENANT_ID,
    ];

    public function purchases(): HasMany
    {
        return $this->hasMany(ProviderPurchaseModel::class, 'provider_id')
            ->orderByDesc('created_at');
    }
}
