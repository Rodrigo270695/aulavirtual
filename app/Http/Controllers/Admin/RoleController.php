<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RoleRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Gestión de roles del sistema.
 *
 * Todas las acciones que mutan estado verifican el permiso
 * granular correspondiente para que la UI pueda controlar
 * la visibilidad de los botones por separado.
 */
class RoleController extends Controller
{
    /** Roles del sistema que no se pueden editar ni eliminar */
    private const PROTECTED_ROLES = ['superadmin', 'student', 'instructor'];

    // ── Índice ────────────────────────────────────────────────────────────────

    public function index(): Response
    {
        /*
         * PostgreSQL no permite comparar uuid con varchar implícitamente,
         * por lo que withCount('users') falla al hacer:
         *   users.id (uuid) = model_has_roles.model_uuid (varchar)
         *
         * Solución: contamos directamente en model_has_roles sin tocar users.id.
         */
        $usersCountSub = DB::table('model_has_roles')
            ->selectRaw('count(*)')
            ->whereColumn('role_id', 'roles.id')
            ->where('model_type', (new User())->getMorphClass());

        $roles = Role::query()
            ->select('roles.*')
            ->selectSub($usersCountSub, 'users_count')
            ->withCount(['permissions'])
            ->with('permissions:id,name')
            ->when(
                request('search'),
                fn ($q, $s) => $q->where('name', 'ilike', "%{$s}%")
            )
            ->when(
                in_array(request('sort_by'), ['name', 'created_at', 'permissions_count', 'users_count']),
                fn ($q) => $q->orderBy(request('sort_by'), request('sort_dir') === 'asc' ? 'asc' : 'desc'),
                fn ($q) => $q->orderBy('created_at', 'desc')
            )
            ->paginate((int) request('per_page', 10))
            ->withQueryString();

        $permissions = Permission::orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/roles/index', [
            'roles'       => $roles,
            'permissions' => $permissions,
            'filters'     => request()->only(['search', 'per_page', 'sort_by', 'sort_dir']),
            'can'         => [
                'create'      => auth()->user()->can('roles.create'),
                'edit'        => auth()->user()->can('roles.edit'),
                'delete'      => auth()->user()->can('roles.delete'),
                'permissions' => auth()->user()->can('roles.permissions'),
            ],
        ]);
    }

    // ── Crear ─────────────────────────────────────────────────────────────────

    public function store(RoleRequest $request): RedirectResponse
    {
        $this->authorize('roles.create');

        $role = Role::create([
            'name'       => $request->name,
            'guard_name' => 'web',
        ]);

        if ($request->filled('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return back()->with('success', "Rol «{$role->name}» creado exitosamente.");
    }

    // ── Actualizar ────────────────────────────────────────────────────────────

    public function update(RoleRequest $request, Role $role): RedirectResponse
    {
        $this->authorize('roles.edit');

        if (in_array($role->name, self::PROTECTED_ROLES)) {
            return back()->with('error', "El rol «{$role->name}» es del sistema y no puede modificarse.");
        }

        $role->update(['name' => $request->name]);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions ?? []);
        }

        return back()->with('success', "Rol «{$role->name}» actualizado exitosamente.");
    }

    // ── Eliminar ──────────────────────────────────────────────────────────────

    public function destroy(Role $role): RedirectResponse
    {
        $this->authorize('roles.delete');

        if (in_array($role->name, self::PROTECTED_ROLES)) {
            return back()->with('error', "El rol «{$role->name}» es del sistema y no puede eliminarse.");
        }

        $usersCount = DB::table('model_has_roles')
            ->where('role_id', $role->id)
            ->where('model_type', (new User())->getMorphClass())
            ->count();

        if ($usersCount > 0) {
            return back()->with('error', "No puedes eliminar el rol «{$role->name}» porque tiene {$usersCount} usuario(s) asignado(s).");
        }

        $name = $role->name;
        $role->delete();

        return back()->with('success', "Rol «{$name}» eliminado exitosamente.");
    }
}
