<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Usuarios con únicamente el rol "student" no acceden al panel tipo dashboard de la app ni al prefijo /admin.
 */
class RedirectStudentFromStaffAreas
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User && $user->isStudentOnly()) {
            return redirect()->route('home');
        }

        return $next($request);
    }
}
