<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InstructorRequest;
use App\Models\Instructor;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class InstructorController extends Controller
{
    public function index(): Response
    {
        $sortBy = request('sort_by');
        $sortDir = request('sort_dir') === 'asc' ? 'asc' : 'desc';

        $instructors = Instructor::query()
            ->with(['user:id,first_name,last_name,email,is_active'])
            ->join('users', 'users.id', '=', 'instructors.user_id')
            ->select('instructors.*')
            ->when(
                request('search'),
                function ($query, string $search): void {
                    $query->where(function ($q) use ($search): void {
                        $q->where('users.first_name', 'ilike', "%{$search}%")
                            ->orWhere('users.last_name', 'ilike', "%{$search}%")
                            ->orWhere('users.email', 'ilike', "%{$search}%")
                            ->orWhere('instructors.professional_title', 'ilike', "%{$search}%")
                            ->orWhere('instructors.specialization_area', 'ilike', "%{$search}%");
                    });
                }
            )
            ->when(
                request()->filled('status'),
                fn ($q) => $q->where('instructors.status', request('status'))
            )
            ->when(
                in_array($sortBy, ['email', 'professional_title', 'status', 'total_students', 'total_courses', 'avg_rating', 'created_at'], true),
                function ($q) use ($sortBy, $sortDir): void {
                    if ($sortBy === 'email') {
                        $q->orderBy('users.email', $sortDir);

                        return;
                    }

                    $q->orderBy("instructors.{$sortBy}", $sortDir);
                },
                function ($q) use ($sortBy, $sortDir): void {
                    if ($sortBy === 'name') {
                        $q->orderBy('users.last_name', $sortDir)->orderBy('users.first_name', $sortDir);
                    } else {
                        $q->orderBy('instructors.created_at', 'desc');
                    }
                }
            )
            ->paginate((int) request('per_page', 25))
            ->withQueryString();

        $statusOptions = [
            ['value' => 'pending', 'label' => 'Pendiente'],
            ['value' => 'active', 'label' => 'Activo'],
            ['value' => 'suspended', 'label' => 'Suspendido'],
            ['value' => 'rejected', 'label' => 'Rechazado'],
        ];

        $availableUsers = User::query()
            ->select('users.id', 'users.first_name', 'users.last_name', 'users.email')
            ->leftJoin('instructors', 'instructors.user_id', '=', 'users.id')
            ->whereNull('instructors.id')
            ->orderBy('users.last_name')
            ->orderBy('users.first_name')
            ->limit(300)
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'label' => trim("{$u->first_name} {$u->last_name}")." ({$u->email})",
            ])
            ->values();

        $filters = request()->only(['search', 'per_page', 'sort_by', 'sort_dir', 'status']);
        /** @var User|null $authUser */
        $authUser = Auth::user();

        return Inertia::render('admin/instructors/index', [
            'instructors' => $instructors,
            'userOptions' => $availableUsers,
            'statusOptions' => $statusOptions,
            'filters' => $filters,
            'can' => [
                'create' => $authUser?->can('instructores.create') ?? false,
                'edit' => $authUser?->can('instructores.edit') ?? false,
                'delete' => $authUser?->can('instructores.delete') ?? false,
            ],
        ]);
    }

    public function store(InstructorRequest $request): RedirectResponse
    {
        $this->authorize('instructores.create');

        $validated = $request->validated();
        $validated['revenue_share_pct'] = $validated['revenue_share_pct'] ?? 70.00;
        $validated['approved_at'] = ($validated['status'] ?? 'pending') === 'active' ? now() : null;

        $instructor = Instructor::create($validated);

        return back()->with('success', "Instructor creado: {$instructor->professional_title}.");
    }

    public function update(InstructorRequest $request, Instructor $instructor): RedirectResponse
    {
        $this->authorize('instructores.edit');

        $validated = $request->validated();
        $validated['revenue_share_pct'] = $validated['revenue_share_pct'] ?? 70.00;
        $validated['approved_at'] = ($validated['status'] ?? 'pending') === 'active'
            ? ($instructor->approved_at ?? now())
            : null;

        $instructor->update($validated);

        return back()->with('success', "Instructor actualizado: {$instructor->professional_title}.");
    }

    public function destroy(Instructor $instructor): RedirectResponse
    {
        $this->authorize('instructores.delete');

        $title = $instructor->professional_title;
        $instructor->delete();

        return back()->with('success', "Instructor eliminado: {$title}.");
    }
}
