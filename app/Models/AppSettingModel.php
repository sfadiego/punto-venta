<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppSettingModel extends Model
{
    protected $table = 'app_settings';

    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    public static function getValue(string $key, mixed $default = null): mixed
    {
        return self::find($key)?->value ?? $default;
    }

    public static function setValue(string $key, mixed $value): void
    {
        self::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    /**
     * Datos de pago del SaaS (cuenta bancaria/WhatsApp para renovar suscripción) — globales,
     * no por tenant. Compartido entre BusinessConfigController::subscriptionStatus() (ya
     * logueado, cualquier estatus) y AuthService::login() (bloqueado por suscripción vencida,
     * antes de tener token) para no duplicar la misma lectura de config/app_settings.
     */
    public static function paymentInfo(): array
    {
        return [
            'payment_whatsapp' => config('business.payment_whatsapp'),
            'payment_info' => json_decode(self::getValue('payment_info', 'null'), true),
        ];
    }
}
