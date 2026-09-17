<?php

namespace App\Models;

use App\Enums\MainOrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Sanctum\NewAccessToken;

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
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(BusinessConfigModel::class, self::TENANT_ID);
    }

    public function branches(): BelongsToMany
    {
        return $this->belongsToMany(BranchModel::class, 'user_branch', 'user_id', 'branch_id');
    }

    /**
     * Admin siempre tiene acceso a todas las sucursales del tenant sin necesidad de fila
     * en user_branch — mismo criterio de bypass ya usado por RolePermissionService.
     */
    public function authorizedBranchIds(): array
    {
        if ($this->rol_id === RoleEnum::ADMIN->value) {
            return BranchModel::where(BranchModel::TENANT_ID, $this->tenant_id)->pluck('id')->all();
        }

        return $this->branches()->pluck('branches.id')->all();
    }

    public function canAccessBranch(int $branchId): bool
    {
        if ($this->rol_id === RoleEnum::ADMIN->value) {
            return BranchModel::where('id', $branchId)->where(BranchModel::TENANT_ID, $this->tenant_id)->exists();
        }

        return $this->branches()->where('branches.id', $branchId)->exists();
    }

    public static function authUser($token): ?User
    {
        $accessToken = PersonalAccessToken::findToken($token);

        return $accessToken?->tokenable;
    }

    /**
     * Mensaje de error si este usuario tiene una caja propia abierta en alguna de las
     * sucursales que se le están por quitar (reasignación de sucursales), o null si es
     * seguro. Sin esto, reasignar a un usuario a media jornada lo deja sin poder cerrar
     * (ni siquiera ver) la caja que él mismo abrió — canAccessBranch() ya no lo cubre en
     * cuanto pierde la sucursal.
     */
    public function blockRemovingBranchesReason(array $branchIdsBeingRemoved): ?string
    {
        if ($branchIdsBeingRemoved === []) {
            return null;
        }

        $branch = MainOrderReportModel::withoutGlobalScopes()
            ->where(MainOrderReportModel::USER_ID, $this->id)
            ->where(MainOrderReportModel::ESTATUS_CAJA, MainOrderStatusEnum::OPEN)
            ->whereIn(MainOrderReportModel::BRANCH_ID, $branchIdsBeingRemoved)
            ->with('branch')
            ->first()
            ?->branch;

        if (! $branch) {
            return null;
        }

        return "Este usuario tiene una caja abierta en \"{$branch->name}\" — ciérrala antes de quitarle esa sucursal.";
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

        // Esta API es 100% por token — Auth::attempt() solo se usa para validar el
        // password, no debe dejar una sesión 'web' autenticada como efecto colateral.
        Auth::guard('web')->logout();

        if (! $user->activo) {
            return self::LOGIN_INACTIVE;
        }

        $token = $user->issueAccessToken();

        return [
            'user' => $user,
            'access_token' => $token->plainTextToken,
            'access_token_id' => $token->accessToken->id,
        ];
    }

    public static function generateAccessToken($user)
    {
        return $user->issueAccessToken()->plainTextToken;
    }

    public function issueAccessToken(): NewAccessToken
    {
        $token = $this->createToken('access_token');
        $token->accessToken->update([PersonalAccessToken::TENANT_ID => $this->tenant_id]);

        return $token;
    }

    /** Revoca todas las demás sesiones de esta cuenta, dejando solo el token indicado (single-session-per-cuenta). */
    public function revokeOtherSessions(int $exceptTokenId): void
    {
        $this->tokens()->where('id', '!=', $exceptTokenId)->delete();
    }
}
