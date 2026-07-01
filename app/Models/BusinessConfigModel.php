<?php

namespace App\Models;

use App\Enums\BusinessTypeEnum;
use App\Enums\SubscriptionStatusEnum;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class BusinessConfigModel extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'business_config';

    const SLUG = 'slug';

    const ACTIVO = 'activo';

    const BUSINESS_NAME = 'business_name';

    const PRIMARY_COLOR = 'primary_color';

    const SIDEBAR_COLOR = 'sidebar_color';

    const FONT_COLOR = 'font_color';

    const LABEL_COLOR = 'label_color';

    const LOGO_PATH = 'logo_path';

    const PHONE = 'phone';

    const ADDRESS = 'address';

    const FACEBOOK = 'facebook';

    const INSTAGRAM = 'instagram';

    const WHATSAPP = 'whatsapp';

    const WEBSITE = 'website';

    const TICKET_FOOTER = 'ticket_footer';

    const PRINTER_NAME = 'printer_name';

    const PRINTER_HOST = 'printer_host';

    const PRINTER_ENABLED = 'printer_enabled';

    const MENU_ENABLED = 'menu_enabled';

    const LOGO_ICON = 'logo_icon';

    const TIPO_NEGOCIO = 'tipo_negocio';

    const COSTO_DOMICILIO_DEFAULT = 'costo_domicilio_default';

    const SUBSCRIPTION_PLAN = 'subscription_plan';

    const SUBSCRIPTION_EXPIRES_AT = 'subscription_expires_at';

    const GRACE_DAYS = 3;

    protected $casts = [
        self::ACTIVO => 'boolean',
        self::PRINTER_ENABLED => 'boolean',
        self::MENU_ENABLED => 'boolean',
        self::TIPO_NEGOCIO => BusinessTypeEnum::class,
        self::SUBSCRIPTION_EXPIRES_AT => 'date',
    ];

    protected $fillable = [
        self::SLUG,
        self::ACTIVO,
        self::BUSINESS_NAME,
        self::PRIMARY_COLOR,
        self::SIDEBAR_COLOR,
        self::FONT_COLOR,
        self::LABEL_COLOR,
        self::LOGO_PATH,
        self::PHONE,
        self::ADDRESS,
        self::FACEBOOK,
        self::INSTAGRAM,
        self::WHATSAPP,
        self::WEBSITE,
        self::TICKET_FOOTER,
        self::PRINTER_NAME,
        self::PRINTER_HOST,
        self::PRINTER_ENABLED,
        self::MENU_ENABLED,
        self::LOGO_ICON,
        self::TIPO_NEGOCIO,
        self::COSTO_DOMICILIO_DEFAULT,
        self::SUBSCRIPTION_PLAN,
        self::SUBSCRIPTION_EXPIRES_AT,
    ];

    public function getSubscriptionStatusAttribute(): string
    {
        if (! $this->subscription_expires_at) {
            return SubscriptionStatusEnum::Pending->value;
        }

        if ($this->subscription_plan === 'lifetime') {
            return SubscriptionStatusEnum::Active->value;
        }

        $now = Carbon::today();
        $expires = Carbon::parse($this->subscription_expires_at);

        if ($expires->gte($now)) {
            return SubscriptionStatusEnum::Active->value;
        }

        if ($expires->gte($now->copy()->subDays(self::GRACE_DAYS))) {
            return SubscriptionStatusEnum::Grace->value;
        }

        return SubscriptionStatusEnum::Expired->value;
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'tenant_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(SubscriptionModel::class, 'tenant_id');
    }

    public function latestSubscription(): HasOne
    {
        return $this->hasOne(SubscriptionModel::class, 'tenant_id')->latestOfMany('expires_at');
    }

    /** Crea el tenant por defecto si no existe (usado en seeders). */
    public static function createDefault(string $slug = 'pos-app'): self
    {
        return self::firstOrCreate(
            [self::SLUG => $slug],
            [
                self::BUSINESS_NAME => env('APP_FULL_NAME', 'pos-app'),
                self::PRIMARY_COLOR => '#f59e0b',
                self::SIDEBAR_COLOR => '#1c1917',
                self::FONT_COLOR => '#ffffff',
                self::LABEL_COLOR => '#1c1917',
            ]
        );
    }
}
