<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Verifica que el usuario autenticado tenga el permiso requerido.
     *
     * Uso en rutas:
     *   ->middleware('permission:dashboard.view')
     *   ->middleware('permission:dashboard.view|cursos.view')  // cualquiera de los dos
     *
     * Si el usuario no tiene el permiso devuelve 403 en API
     * o redirige a /dashboard con mensaje en web.
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        if (! $request->user()) {
            return $request->expectsJson()
                ? response()->json(['message' => 'No autenticado.'], 401)
                : redirect()->route('login');
        }

        foreach ($permissions as $permission) {
            if ($request->user()->can($permission)) {
                return $next($request);
            }
        }

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'No tienes permiso para realizar esta acción.',
            ], 403);
        }

        abort(403, 'No tienes permiso para acceder a esta sección.');
    }
}
