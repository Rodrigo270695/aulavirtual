<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cierra sesión si la cuenta pasó a inactiva o baneada (p. ej. desde el panel admin).
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && (! $user->is_active || $user->is_banned)) {
            Auth::logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()
                ->route('login')
                ->with('error', $user->is_banned
                    ? 'Tu cuenta ha sido suspendida.'
                    : 'Tu cuenta está desactivada. Si crees que es un error, contacta al administrador.');
        }

        return $next($request);
    }
}
