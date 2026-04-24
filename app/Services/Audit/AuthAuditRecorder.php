<?php

namespace App\Services\Audit;

use App\Models\ActivityLog;
use App\Models\LoginHistory;
use App\Models\User;
use App\Support\Audit\UserAgentDigest;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Laravel\Fortify\Fortify;

/**
 * Escribe filas en login_history y activity_logs para eventos de autenticación.
 */
final class AuthAuditRecorder
{
    public static function recordLogin(Request $request, User $user): void
    {
        try {
            $ua = (string) $request->userAgent();
            $digest = UserAgentDigest::summarize($ua);
            $identifier = self::identifierFromRequest($request);

            LoginHistory::query()->create([
                'user_id' => $user->id,
                'login_identifier' => $identifier,
                'ip_address' => $request->ip() ?? '0.0.0.0',
                'user_agent' => Str::limit($ua, 2000, ''),
                'device_type' => $digest['device_type'],
                'browser' => $digest['browser'],
                'os' => $digest['os'],
                'status' => 'success',
                'failure_reason' => null,
            ]);

            ActivityLog::query()->create([
                'user_id' => $user->id,
                'action' => 'auth.login',
                'subject_type' => User::class,
                'subject_id' => $user->id,
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit($ua, 2000, ''),
                'session_id' => $request->hasSession() ? $request->session()->getId() : null,
                'extra_data' => [
                    'browser' => $digest['browser'],
                    'os' => $digest['os'],
                    'device_type' => $digest['device_type'],
                    'login_identifier' => $identifier,
                ],
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    public static function recordFailedLogin(Request $request, ?User $user, array $credentials, string $reason = 'invalid_credentials'): void
    {
        try {
            $ua = (string) $request->userAgent();
            $digest = UserAgentDigest::summarize($ua);
            $identifier = self::identifierFromCredentials($request, $credentials);

            LoginHistory::query()->create([
                'user_id' => $user?->id,
                'login_identifier' => $identifier,
                'ip_address' => $request->ip() ?? '0.0.0.0',
                'user_agent' => Str::limit($ua, 2000, ''),
                'device_type' => $digest['device_type'],
                'browser' => $digest['browser'],
                'os' => $digest['os'],
                'status' => 'failed',
                'failure_reason' => Str::limit($reason, 100),
            ]);

            ActivityLog::query()->create([
                'user_id' => $user?->id,
                'action' => 'auth.login_failed',
                'subject_type' => $user instanceof User ? User::class : null,
                'subject_id' => $user?->id,
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit($ua, 2000, ''),
                'session_id' => $request->hasSession() ? $request->session()->getId() : null,
                'extra_data' => [
                    'login_identifier' => $identifier,
                    'reason' => $reason,
                    'browser' => $digest['browser'],
                    'os' => $digest['os'],
                ],
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    public static function recordLogout(Request $request, User $user): void
    {
        try {
            $ua = (string) $request->userAgent();
            $digest = UserAgentDigest::summarize($ua);

            ActivityLog::query()->create([
                'user_id' => $user->id,
                'action' => 'auth.logout',
                'subject_type' => User::class,
                'subject_id' => $user->id,
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit($ua, 2000, ''),
                'session_id' => $request->hasSession() ? $request->session()->getId() : null,
                'extra_data' => [
                    'browser' => $digest['browser'],
                    'os' => $digest['os'],
                ],
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    private static function identifierFromRequest(Request $request): ?string
    {
        $key = Fortify::username();
        $value = $request->input($key);

        return is_string($value) && $value !== '' ? Str::lower(trim($value)) : null;
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    private static function identifierFromCredentials(Request $request, array $credentials): ?string
    {
        $key = Fortify::username();
        $fromCreds = $credentials[$key] ?? $credentials['email'] ?? null;
        if (is_string($fromCreds) && $fromCreds !== '') {
            return Str::lower(trim($fromCreds));
        }

        return self::identifierFromRequest($request);
    }
}
