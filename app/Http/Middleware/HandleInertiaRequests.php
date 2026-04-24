<?php

namespace App\Http\Middleware;

use App\Models\PlatformSetting;
use App\Services\MarketplaceCartService;
use App\Support\LearningEnrollmentView;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Laravel\Fortify\Features;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $cart = app(MarketplaceCartService::class);

        return [
            ...parent::share($request),
            'name'     => config('app.name'),
            'platform' => PlatformSetting::forFrontend(),
            'cartCount' => $cart->count($request),
            'cartCourseIds' => $cart->ids($request),
            'enrolledCourseIds' => $user
                ? $user->enrollments()->whereNotNull('course_id')->pluck('course_id')->values()->all()
                : [],
            'learningMenu' => $user
                ? LearningEnrollmentView::rows($user, 4)
                : [],
            'notificationsBell' => $user ? [
                'unread_count' => $user->appNotifications()
                    ->whereNull('archived_at')
                    ->whereNull('read_at')
                    ->count(),
                'recent' => $user->appNotifications()
                    ->whereNull('archived_at')
                    ->latest()
                    ->limit(6)
                    ->get([
                        'id',
                        'title',
                        'body',
                        'action_url',
                        'action_text',
                        'category',
                        'priority',
                        'read_at',
                        'created_at',
                    ])
                    ->map(fn ($n) => [
                        'id' => $n->id,
                        'title' => $n->title,
                        'body' => $n->body,
                        'action_url' => $n->action_url,
                        'action_text' => $n->action_text,
                        'category' => $n->category,
                        'priority' => $n->priority,
                        'read_at' => $n->read_at?->toIso8601String(),
                        'created_at' => $n->created_at?->toIso8601String(),
                    ])
                    ->values(),
            ] : [
                'unread_count' => 0,
                'recent' => [],
            ],
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    // Campo virtual para compatibilidad con componentes que usan user.name
                    'name' => trim("{$user->first_name} {$user->last_name}"),
                ]) : null,
                // Lista plana de nombres de permisos del usuario autenticado
                'permissions' => $user ? $user->getAllPermissions()->pluck('name')->toArray() : [],
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
                'info'    => $request->session()->get('info'),
                'warning' => $request->session()->get('warning'),
            ],
            'canRegister' => Features::enabled(Features::registration()),
        ];
    }
}
