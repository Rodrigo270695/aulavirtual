<?php

use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RedirectStudentFromStaffAreas;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            EnsureUserIsActive::class,
        ]);

        // Alias de middleware para uso en rutas: ->middleware('permission:nombre.permiso')
        $middleware->alias([
            'permission' => CheckPermission::class,
            'role'       => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'student.marketplace' => RedirectStudentFromStaffAreas::class,
        ]);

        $middleware->redirectGuestsTo(function (Request $request): ?string {
            // En navegación web enviamos al login; en API/JSON conservamos 401.
            return $request->expectsJson() ? null : route('login');
        });

        $middleware->redirectUsersTo(function () {
            $user = auth()->user();
            if ($user instanceof User && $user->isStudentOnly()) {
                return route('home');
            }

            return route('dashboard');
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (AuthenticationException $exception, Request $request) {
            if ($request->is('api/*')) {
                return null;
            }

            return redirect()->guest(route('login'));
        });
    })->create();
