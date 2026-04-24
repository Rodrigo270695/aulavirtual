<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

/**
 * Gestión de usuarios del panel administrativo.
 */
class UserController extends Controller
{
    // ── Índice ────────────────────────────────────────────────────────────────

    public function index(): Response
    {
        $sortBy = request('sort_by');
        $sortDir = request('sort_dir') === 'asc' ? 'asc' : 'desc';

        /*
         * Spatie guarda el id del modelo en model_uuid. Tras la migración que alinea la columna
         * a tipo uuid en PostgreSQL, hay que comparar uuid con uuid (users.id::text rompe con 42883).
         */
        $pivot = config('permission.table_names.model_has_roles');
        $morphKey = config('permission.column_names.model_morph_key');

        $rolesCountSub = DB::table($pivot)
            ->selectRaw('count(*)')
            ->whereColumn("{$pivot}.{$morphKey}", 'users.id')
            ->where($pivot.'.model_type', (new User)->getMorphClass());

        $users = User::query()
            ->select('users.*')
            ->selectSub($rolesCountSub, 'roles_count')
            ->with(['roles:id,name'])
            ->when(
                request('search'),
                function ($query, string $search): void {
                    $query->where(function ($q) use ($search): void {
                        $q->where('first_name', 'ilike', "%{$search}%")
                            ->orWhere('last_name', 'ilike', "%{$search}%")
                            ->orWhere('email', 'ilike', "%{$search}%")
                            ->orWhere('username', 'ilike', "%{$search}%")
                            ->orWhere('document_number', 'ilike', "%{$search}%")
                            ->orWhere('phone_number', 'ilike', "%{$search}%");
                    });
                }
            )
            ->when(
                request()->filled('role_id') && (int) request('role_id') > 0,
                function ($query) use ($pivot, $morphKey): void {
                    $roleId = (int) request('role_id');
                    $modelType = (new User)->getMorphClass();
                    $query->whereExists(function ($q) use ($pivot, $morphKey, $roleId, $modelType): void {
                        $q->selectRaw('1')
                            ->from($pivot)
                            ->whereColumn("{$pivot}.{$morphKey}", 'users.id')
                            ->where($pivot.'.role_id', $roleId)
                            ->where($pivot.'.model_type', $modelType);
                    });
                }
            )
            ->when(
                request()->filled('is_active') && in_array((string) request('is_active'), ['0', '1'], true),
                fn ($q) => $q->where('is_active', request('is_active') === '1')
            )
            ->when(
                in_array($sortBy, ['email', 'created_at', 'roles_count', 'is_active'], true),
                fn ($q) => $q->orderBy($sortBy, $sortDir),
                function ($q) use ($sortBy, $sortDir): void {
                    if ($sortBy === 'name') {
                        $q->orderBy('last_name', $sortDir)->orderBy('first_name', $sortDir);
                    } else {
                        $q->orderBy('created_at', 'desc');
                    }
                }
            )
            ->paginate((int) request('per_page', 25))
            ->withQueryString()
            ->through(function (User $user): User {
                $user->setAttribute('is_immutable_demo', $user->isImmutableDemoAccount());

                return $user;
            });

        $roleOptions = Role::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get(['id', 'name']);

        $filters = request()->only(['search', 'per_page', 'sort_by', 'sort_dir', 'role_id', 'is_active']);
        if (! request()->filled('role_id') || (int) request('role_id') < 1) {
            unset($filters['role_id']);
        }
        if (! request()->filled('is_active') || ! in_array((string) request('is_active'), ['0', '1'], true)) {
            unset($filters['is_active']);
        }

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roleOptions' => $roleOptions,
            'filters' => $filters,
            'can' => [
                'create' => auth()->user()->can('usuarios.create'),
                'edit' => auth()->user()->can('usuarios.edit'),
                'delete' => auth()->user()->can('usuarios.delete'),
            ],
        ]);
    }

    // ── Crear ─────────────────────────────────────────────────────────────────

    public function store(UserRequest $request): RedirectResponse
    {
        $this->authorize('usuarios.create');

        $validated = $request->validated();
        $roleIds = $this->normalizedRoleIds($validated['roles'] ?? []);
        unset($validated['roles'], $validated['password_confirmation']);
        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);
        $user->syncRoles(Role::query()->whereIn('id', $roleIds)->where('guard_name', 'web')->get());

        return back()->with('success', "Usuario «{$user->email}» creado exitosamente.");
    }

    // ── Actualizar ────────────────────────────────────────────────────────────

    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $this->authorize('usuarios.edit');

        if ($user->isImmutableDemoAccount()) {
            return back()->with(
                'error',
                'Esta cuenta está protegida: no puede modificarse desde el panel (incluido el correo y la contraseña).',
            );
        }

        $validated = $request->validated();
        $roleIds = $this->normalizedRoleIds($validated['roles'] ?? []);
        unset($validated['roles'], $validated['password_confirmation']);

        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);
        $user->syncRoles(Role::query()->whereIn('id', $roleIds)->where('guard_name', 'web')->get());

        return back()->with('success', "Usuario «{$user->email}» actualizado exitosamente.");
    }

    // ── Eliminar ──────────────────────────────────────────────────────────────

    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('usuarios.delete');

        if ($user->isImmutableDemoAccount()) {
            return back()->with('error', 'Esta cuenta está protegida y no puede eliminarse.');
        }

        if ($user->is(auth()->user())) {
            return back()->with('error', 'No puedes eliminar tu propia cuenta.');
        }

        $email = $user->email;
        $user->delete();

        return back()->with('success', "Usuario «{$email}» eliminado exitosamente.");
    }

    /**
     * @param  array<int, mixed>  $roles
     * @return array<int, int>
     */
    private function normalizedRoleIds(array $roles): array
    {
        return collect($roles)
            ->filter(fn ($id) => $id !== null && $id !== '')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
    }
}
