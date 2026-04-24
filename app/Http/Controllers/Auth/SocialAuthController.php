<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserSocialAccount;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class SocialAuthController extends Controller
{
    /** Proveedores habilitados */
    private const PROVIDERS = ['google', 'github'];

    /**
     * Redirige al usuario a la página de autorización del proveedor OAuth.
     */
    public function redirect(Request $request, string $provider): RedirectResponse
    {
        $this->ensureValidProvider($provider);

        $driver = Socialite::driver($provider);
        // Importante: usar el mismo host del request actual evita InvalidStateException
        // cuando se navega con 127.0.0.1 en vez de localhost (o viceversa).
        if (method_exists($driver, 'redirectUrl')) {
            call_user_func([$driver, 'redirectUrl'], $request->url().'/callback');
        }

        // GitHub no expone el email en el scope por defecto; hace falta user:email.
        if ($provider === 'github') {
            if (method_exists($driver, 'scopes')) {
                call_user_func([$driver, 'scopes'], ['user:email']);
            }
        }

        return $driver->redirect();
    }

    /**
     * Maneja el callback del proveedor OAuth.
     * Devuelve una vista que:
     *  - Si fue abierto en popup → envía postMessage al padre y se cierra.
     *  - Si fue redirect normal  → redirige directamente al destino.
     *
     * Flujo:
     *  1. Si la cuenta social ya existe → inicia sesión.
     *  2. Si el email ya existe en users  → vincula la cuenta social y accede.
     *  3. Si es completamente nuevo       → crea usuario + cuenta social y accede.
     */
    public function callback(Request $request, string $provider): View|RedirectResponse
    {
        $this->ensureValidProvider($provider);

        try {
            $driver = Socialite::driver($provider);
            // Debe coincidir con la redirectUrl usada al iniciar OAuth.
            if (method_exists($driver, 'redirectUrl')) {
                call_user_func([$driver, 'redirectUrl'], $request->url());
            }
            $socialUser = $driver->user();
        } catch (\Throwable $e) {
            Log::error('OAuth Socialite callback falló', [
                'provider' => $provider,
                'message'  => $e->getMessage(),
            ]);
            report($e);

            return $this->popupResponse(
                redirectTo: route('login'),
                error: 'No se pudo conectar con ' . ucfirst($provider) . '. Inténtalo de nuevo.',
            );
        }

        $email = $socialUser->getEmail();
        if ($email === null || $email === '') {
            return $this->popupResponse(
                redirectTo: route('login'),
                error: 'No pudimos obtener tu correo desde ' . ucfirst($provider) . '. Activa el email público o concede permiso de lectura del email.',
            );
        }

        // 1. Buscar cuenta social existente
        $socialAccount = UserSocialAccount::where('provider', $provider)
            ->where('provider_id', $socialUser->getId())
            ->first();

        if ($socialAccount) {
            $this->updateTokens($socialAccount, $socialUser);
            $linkedUser = $socialAccount->user;
            $denied = $this->socialLoginDeniedMessage($linkedUser);
            if ($denied !== null) {
                return $this->popupResponse(route('login'), error: $denied);
            }
            // Cuentas creadas antes de que email_verified_at fuera asignable masivamente
            if ($linkedUser->email_verified_at === null) {
                $linkedUser->forceFill(['email_verified_at' => now()])->save();
            }
            $this->ensureUserCanAccessDashboard($linkedUser);
            app()[PermissionRegistrar::class]->forgetCachedPermissions();
            Auth::login($linkedUser, remember: true);

            return $this->popupResponse($this->postLoginRedirectUrl($linkedUser));
        }

        // 2. Buscar usuario por email
        $user = User::where('email', $email)->first();
        $created = false;

        if (! $user) {
            // 3. Crear nuevo usuario
            $nameParts = explode(' ', trim($socialUser->getName() ?? ''), 2);
            $firstName = $nameParts[0] ?: ($socialUser->getNickname() ?? 'Usuario');
            $lastName  = $nameParts[1] ?? '';

            $user = User::create([
                'first_name'        => $firstName,
                'last_name'         => $lastName,
                'email'             => $email,
                'avatar'            => $socialUser->getAvatar(),
                'email_verified_at' => now(),
                'password'          => null,   // login solo social
                'is_active'         => true,
                'is_banned'         => false,
                'country_code'      => 'PE',
                'timezone'          => 'America/Lima',
            ]);
            $created = true;
        }

        if (! $created) {
            $denied = $this->socialLoginDeniedMessage($user);
            if ($denied !== null) {
                return $this->popupResponse(route('login'), error: $denied);
            }
        }

        // Crear vínculo social
        UserSocialAccount::create([
            'user_id'                => $user->id,
            'provider'               => $provider,
            'provider_id'            => $socialUser->getId(),
            'provider_token'         => $socialUser->token,
            'provider_refresh_token' => $socialUser->refreshToken,
            'token_expires_at'       => $socialUser->expiresIn
                ? now()->addSeconds($socialUser->expiresIn)
                : null,
        ]);

        // Asignar rol por defecto si el usuario no tiene ninguno
        if ($user->roles->isEmpty()) {
            $student = $this->ensureStudentRoleHasDashboardAccess();
            $user->assignRole($student);
        }

        $this->ensureUserCanAccessDashboard($user);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        Auth::login($user, remember: true);

        return $this->popupResponse($this->postLoginRedirectUrl($user));
    }

    private function postLoginRedirectUrl(User $user): string
    {
        $user->loadMissing('roles');

        return $user->isStudentOnly() ? route('home') : route('dashboard');
    }

    // ──────────────────────────────────────────────────────────────────────

    private function socialLoginDeniedMessage(User $user): ?string
    {
        if ($user->is_banned) {
            return 'Tu cuenta ha sido suspendida.';
        }

        if (! $user->is_active) {
            return 'Tu cuenta está desactivada. Si crees que es un error, contacta al administrador.';
        }

        return null;
    }

    private function ensureValidProvider(string $provider): void
    {
        if (! in_array($provider, self::PROVIDERS, strict: true)) {
            abort(404);
        }
    }

    /**
     * Garantiza que el rol student exista y pueda ver el dashboard (p. ej. si se creó antes del seeder de permisos).
     */
    private function ensureStudentRoleHasDashboardAccess(): Role
    {
        Permission::firstOrCreate(['name' => 'dashboard.view', 'guard_name' => 'web']);
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $student = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);

        if (! $student->hasPermissionTo('dashboard.view')) {
            $student->givePermissionTo('dashboard.view');
        }

        return $student;
    }

    /**
     * Si el usuario no tiene ningún permiso de panel, asigna rol student con acceso al dashboard.
     */
    private function ensureUserCanAccessDashboard(User $user): void
    {
        if ($user->can('dashboard.view')) {
            return;
        }

        $student = $this->ensureStudentRoleHasDashboardAccess();
        if (! $user->hasRole('student')) {
            $user->assignRole($student);
        }
    }

    private function updateTokens(UserSocialAccount $account, mixed $socialUser): void
    {
        $account->update([
            'provider_token'         => $socialUser->token,
            'provider_refresh_token' => $socialUser->refreshToken,
            'token_expires_at'       => $socialUser->expiresIn
                ? now()->addSeconds($socialUser->expiresIn)
                : null,
        ]);
    }

    /**
     * Devuelve la vista que cierra el popup y notifica al padre (o redirige si no hay popup).
     *
     * Siempre usa ruta relativa (p. ej. /dashboard) para que la ventana padre no cambie de host
     * (localhost vs 127.0.0.1) y pierda la cookie de sesión creada en el popup.
     */
    private function popupResponse(string $redirectTo, ?string $error = null): View
    {
        return view('auth.social-callback', [
            'redirectTo' => $this->toRelativeAppUrl($redirectTo),
            'error'      => $error,
        ]);
    }

    /**
     * Convierte una URL absoluta o relativa en path + query (+ fragment) dentro de la app.
     */
    private function toRelativeAppUrl(string $url): string
    {
        $path = parse_url($url, PHP_URL_PATH);
        if (! is_string($path) || $path === '') {
            $path = '/';
        }

        $query = parse_url($url, PHP_URL_QUERY);
        $fragment = parse_url($url, PHP_URL_FRAGMENT);

        $out = $path;
        if (is_string($query) && $query !== '') {
            $out .= '?'.$query;
        }
        if (is_string($fragment) && $fragment !== '') {
            $out .= '#'.$fragment;
        }

        return $out;
    }
}
