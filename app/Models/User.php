<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Sanctum\PersonalAccessToken;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasTenant, Notifiable;

    const NOMBRE = 'nombre';

    const APELLIDO_MATERNO = 'apellido_materno';

    const APELLIDO_PATERNO = 'apellido_paterno';

    const ROL_ID = 'rol_id';

    const ACTIVO = 'activo';

    const EMAIL = 'email';

    const USUARIO = 'usuario';

    const PASSWORD = 'password';

    const TENANT_ID = 'tenant_id';

    const LAST_SEEN_AT = 'last_seen_at';

    const LOGIN_INACTIVE = 'login_inactive';

    protected $fillable = [
        self::NOMBRE,
        self::EMAIL,
        self::USUARIO,
        self::APELLIDO_MATERNO,
        self::APELLIDO_PATERNO,
        self::ROL_ID,
        self::ACTIVO,
        self::PASSWORD,
        self::TENANT_ID,
        self::LAST_SEEN_AT,
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            self::LAST_SEEN_AT => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(BusinessConfigModel::class, self::TENANT_ID);
    }

    public static function authUser($token): ?User
    {
        $accessToken = PersonalAccessToken::findToken($token);

        return $accessToken?->tokenable;
    }

    public static function register(
        string $nombre,
        string $apellidoPaterno,
        int $rolId,
        string $email,
        string $usuario,
        string $password,
        bool $activo = true,
        string $apellidoMaterno = '',
    ): User {
        return User::create([
            'nombre' => $nombre,
            'email' => $email,
            'usuario' => $usuario,
            'apellido_materno' => $apellidoMaterno,
            'rol_id' => $rolId,
            'password' => bcrypt($password),
        ]);
    }

    public static function login(string $email, string $password): mixed
    {
        if (! Auth::attempt(['email' => $email, 'password' => $password])) {
            return false;
        }

        $user = User::where('email', $email)->first();

        if (! $user->activo) {
            Auth::guard()->logout();

            return self::LOGIN_INACTIVE;
        }

        return [
            'user' => $user,
            'access_token' => $user->createToken('access_token')->plainTextToken,
        ];
    }

    public static function generateAccessToken($user)
    {
        return $user->createToken('access_token')->plainTextToken;
    }
}
