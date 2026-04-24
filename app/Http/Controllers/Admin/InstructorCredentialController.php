<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InstructorCredentialRequest;
use App\Models\Instructor;
use App\Models\InstructorCredential;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class InstructorCredentialController extends Controller
{
    public function index(): Response
    {
        /** @var User|null $authUser */
        $authUser = Auth::user();
        $canManageAll = $authUser?->hasAnyRole(['superadmin', 'admin']) ?? false;

        $sortBy = request('sort_by');
        $sortDir = request('sort_dir') === 'asc' ? 'asc' : 'desc';

        $credentials = InstructorCredential::query()
            ->with([
                'instructor:id,user_id',
                'instructor.user:id,first_name,last_name,email',
                'verifier:id,first_name,last_name',
            ])
            ->join('instructors', 'instructors.id', '=', 'instructor_credentials.instructor_id')
            ->join('users', 'users.id', '=', 'instructors.user_id')
            ->select('instructor_credentials.*')
            ->when(
                ! $canManageAll,
                fn ($q) => $q->where('instructors.user_id', $authUser?->id)
            )
            ->when(
                request('search'),
                function ($query, string $search): void {
                    $query->where(function ($q) use ($search): void {
                        $q->where('instructor_credentials.title', 'ilike', "%{$search}%")
                            ->orWhere('instructor_credentials.institution', 'ilike', "%{$search}%")
                            ->orWhere('users.first_name', 'ilike', "%{$search}%")
                            ->orWhere('users.last_name', 'ilike', "%{$search}%")
                            ->orWhere('users.email', 'ilike', "%{$search}%");
                    });
                }
            )
            ->when(
                request()->filled('credential_type'),
                fn ($q) => $q->where('instructor_credentials.credential_type', request('credential_type'))
            )
            ->when(
                request()->filled('is_verified') && in_array((string) request('is_verified'), ['0', '1'], true),
                fn ($q) => $q->where('instructor_credentials.is_verified', request('is_verified') === '1')
            )
            ->when(
                in_array($sortBy, ['title', 'institution', 'credential_type', 'is_verified', 'created_at'], true),
                fn ($q) => $q->orderBy("instructor_credentials.{$sortBy}", $sortDir),
                fn ($q) => $q->orderBy('instructor_credentials.created_at', 'desc')
            )
            ->paginate((int) request('per_page', 25))
            ->withQueryString();

        $instructorOptions = Instructor::query()
            ->with('user:id,first_name,last_name,email')
            ->when(
                ! $canManageAll,
                fn ($q) => $q->where('user_id', $authUser?->id)
            )
            ->get(['id', 'user_id'])
            ->map(fn ($i) => [
                'id' => $i->id,
                'label' => trim("{$i->user?->first_name} {$i->user?->last_name}")." ({$i->user?->email})",
            ])
            ->values();

        $credentialTypeOptions = [
            ['value' => 'degree', 'label' => 'Grado académico'],
            ['value' => 'certification', 'label' => 'Certificación'],
            ['value' => 'award', 'label' => 'Premio'],
            ['value' => 'publication', 'label' => 'Publicación'],
        ];

        $filters = request()->only(['search', 'per_page', 'sort_by', 'sort_dir', 'credential_type', 'is_verified']);

        return Inertia::render('admin/instructor-credentials/index', [
            'credentials' => $credentials,
            'instructorOptions' => $instructorOptions,
            'credentialTypeOptions' => $credentialTypeOptions,
            'canManageAll' => $canManageAll,
            'filters' => $filters,
            'can' => [
                'create' => $authUser?->can('credenciales_docentes.create') ?? false,
                'edit' => $authUser?->can('credenciales_docentes.edit') ?? false,
                'delete' => $authUser?->can('credenciales_docentes.delete') ?? false,
                'verify' => $authUser?->can('credenciales_docentes.verify') ?? false,
            ],
        ]);
    }

    public function store(InstructorCredentialRequest $request): RedirectResponse
    {
        $this->authorize('credenciales_docentes.create');

        /** @var User|null $authUser */
        $authUser = Auth::user();
        $canManageAll = $authUser?->hasAnyRole(['superadmin', 'admin']) ?? false;

        $validated = $request->validated();
        unset($validated['document_path']);

        if ($request->hasFile('document_file')) {
            $validated['document_path'] = $request->file('document_file')->store('instructor-credentials', 'public');
        }

        $canVerify = $authUser?->can('credenciales_docentes.verify') ?? false;

        if (! $canManageAll) {
            $myInstructorId = Instructor::query()
                ->where('user_id', $authUser?->id)
                ->value('id');

            abort_unless($myInstructorId, 403, 'No tienes perfil de instructor.');
            $validated['instructor_id'] = (string) $myInstructorId;
            $validated['is_verified'] = false;
            $validated['verified_by'] = null;
            $validated['verified_at'] = null;
        } elseif (! $canVerify) {
            $validated['is_verified'] = false;
            $validated['verified_by'] = null;
            $validated['verified_at'] = null;
        } elseif (($validated['is_verified'] ?? false) === true) {
            $validated['verified_by'] = Auth::id();
            $validated['verified_at'] = now();
        } else {
            $validated['is_verified'] = false;
            $validated['verified_by'] = null;
            $validated['verified_at'] = null;
        }

        $credential = InstructorCredential::create($validated);

        return back()->with('success', "Credencial registrada: {$credential->title}.");
    }

    public function update(InstructorCredentialRequest $request, InstructorCredential $instructorCredential): RedirectResponse
    {
        $this->authorize('credenciales_docentes.edit');

        /** @var User|null $authUser */
        $authUser = Auth::user();
        $canManageAll = $authUser?->hasAnyRole(['superadmin', 'admin']) ?? false;

        if (! $canManageAll) {
            abort_if(
                $instructorCredential->is_verified,
                403,
                'Esta credencial ya fue verificada y no puede modificarse.'
            );
            abort_unless(
                $instructorCredential->instructor()->where('user_id', $authUser?->id)->exists(),
                403,
                'No puedes editar credenciales de otro instructor.'
            );
        }

        $validated = $request->validated();
        unset($validated['document_path']);

        $canVerify = $authUser?->can('credenciales_docentes.verify') ?? false;

        if (! $canVerify) {
            unset($validated['is_verified'], $validated['verified_by'], $validated['verified_at']);
        } elseif (array_key_exists('is_verified', $validated)) {
            if ($validated['is_verified'] === true) {
                if ($instructorCredential->is_verified) {
                    unset($validated['verified_by'], $validated['verified_at']);
                } else {
                    $validated['verified_by'] = Auth::id();
                    $validated['verified_at'] = now();
                }
            } else {
                $validated['verified_by'] = null;
                $validated['verified_at'] = null;
            }
        }

        if (! $canManageAll) {
            $validated['instructor_id'] = $instructorCredential->instructor_id;
        }

        if ($request->hasFile('document_file')) {
            if ($instructorCredential->document_path) {
                Storage::disk('public')->delete($instructorCredential->document_path);
            }
            $validated['document_path'] = $request->file('document_file')->store('instructor-credentials', 'public');
        }

        $instructorCredential->update($validated);

        return back()->with('success', "Credencial actualizada: {$instructorCredential->title}.");
    }

    public function destroy(InstructorCredential $instructorCredential): RedirectResponse
    {
        $this->authorize('credenciales_docentes.delete');

        /** @var User|null $authUser */
        $authUser = Auth::user();
        $canManageAll = $authUser?->hasAnyRole(['superadmin', 'admin']) ?? false;
        if (! $canManageAll) {
            abort_if(
                $instructorCredential->is_verified,
                403,
                'Esta credencial ya fue verificada y no puede eliminarse.'
            );
            abort_unless(
                $instructorCredential->instructor()->where('user_id', $authUser?->id)->exists(),
                403,
                'No puedes eliminar credenciales de otro instructor.'
            );
        }

        $title = $instructorCredential->title;
        if ($instructorCredential->document_path) {
            Storage::disk('public')->delete($instructorCredential->document_path);
        }
        $instructorCredential->delete();

        return back()->with('success', "Credencial eliminada: {$title}.");
    }
}
