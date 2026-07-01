<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class BusinessConfigModel extends Model
{
    use SoftDeletes;

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

    const LOGO_ICON = 'logo_icon';

    protected $casts = [
        self::ACTIVO => 'boolean',
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
        self::LOGO_ICON,
    ];

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
