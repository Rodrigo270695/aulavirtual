<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\EmitCertificateRequest;
use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Enrollment;
use App\Support\CertificateIssuer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CertificateController extends Controller
{
    public function index(): Response
    {
        $sortBy = request('sort_by');
        $sortDir = request('sort_dir') === 'asc' ? 'asc' : 'desc';
        $search = trim((string) request('search', ''));

        $certificates = Certificate::query()
            ->with(['template:id,name'])
            ->when(
                $search !== '',
                function ($query) use ($search): void {
                    $needle = mb_strtolower($search);
                    $query->where(function ($q) use ($needle): void {
                        $q->whereRaw('LOWER(student_name) LIKE ?', ["%{$needle}%"])
                            ->orWhereRaw('LOWER(course_title) LIKE ?', ["%{$needle}%"])
                            ->orWhereRaw('LOWER(verification_code) LIKE ?', ["%{$needle}%"]);
                    });
                }
            )
            ->when(
                request()->filled('is_revoked') && in_array((string) request('is_revoked'), ['0', '1'], true),
                fn ($q) => $q->where('is_revoked', request('is_revoked') === '1')
            )
            ->when(
                in_array($sortBy, ['student_name', 'course_title', 'issued_at', 'is_revoked'], true),
                fn ($q) => $q->orderBy($sortBy, $sortDir),
                fn ($q) => $q->orderByDesc('issued_at')
            )
            ->paginate((int) request('per_page', 25))
            ->through(fn (Certificate $c): array => [
                'id' => $c->id,
                'verification_code' => $c->verification_code,
                'verification_url' => $c->verification_url,
                'student_name' => $c->student_name,
                'course_title' => $c->course_title,
                'instructor_name' => $c->instructor_name,
                'completion_date' => $c->completion_date?->toDateString(),
                'issued_at' => $c->issued_at?->toIso8601String(),
                'is_revoked' => (bool) $c->is_revoked,
                'revoked_reason' => $c->revoked_reason,
                'template_name' => $c->template?->name,
            ])
            ->withQueryString();

        $enrollmentOptions = Enrollment::query()
            ->with([
                'user:id,first_name,last_name,email',
                'course:id,title,completion_threshold,certificate_enabled',
            ])
            ->where('status', 'active')
            ->whereNotNull('course_id')
            ->whereHas('course', fn ($q) => $q->where('certificate_enabled', true))
            ->whereDoesntHave('certificates', fn ($q) => $q->where('is_revoked', false))
            ->orderByDesc('updated_at')
            ->limit(350)
            ->get()
            ->filter(function (Enrollment $enrollment): bool {
                $threshold = (float) ($enrollment->course?->completion_threshold ?? 99.5);

                return (float) $enrollment->progress_pct >= $threshold;
            })
            ->take(200)
            ->map(function (Enrollment $enrollment): array {
                $userName = trim(($enrollment->user?->first_name ?? '').' '.($enrollment->user?->last_name ?? ''));
                $email = $enrollment->user?->email ?? '';
                $course = $enrollment->course?->title ?? 'Curso';
                $pct = round((float) $enrollment->progress_pct, 2);

                return [
                    'id' => $enrollment->id,
                    'label' => "{$course} · {$userName} ({$email}) · {$pct}%",
                ];
            })
            ->values();

        $templateOptions = CertificateTemplate::query()
            ->where('is_active', true)
            ->orderByDesc('updated_at')
            ->get(['id', 'name'])
            ->map(fn (CertificateTemplate $t): array => ['id' => $t->id, 'label' => $t->name])
            ->values();

        $filters = request()->only(['search', 'per_page', 'sort_by', 'sort_dir', 'is_revoked']);
        if (! request()->filled('is_revoked') || ! in_array((string) request('is_revoked'), ['0', '1'], true)) {
            unset($filters['is_revoked']);
        }

        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        return Inertia::render('admin/certificates/index', [
            'certificates' => $certificates,
            'enrollmentOptions' => $enrollmentOptions,
            'templateOptions' => $templateOptions,
            'filters' => $filters,
            'can' => [
                'emit' => $user?->can('certificados_emitidos.create') ?? false,
                'verifications' => $user?->can('certificados_emitidos.verifications') ?? false,
            ],
        ]);
    }

    public function store(EmitCertificateRequest $request): RedirectResponse
    {
        $this->authorize('certificados_emitidos.create');

        $validated = $request->validated();

        /** @var Enrollment $enrollment */
        $enrollment = Enrollment::query()
            ->with([
                'user:id,first_name,last_name,email',
                'course:id,title,duration_hours,completion_threshold,certificate_enabled,instructor_id',
                'course.instructor.user:id,first_name,last_name',
            ])
            ->whereKey($validated['enrollment_id'])
            ->firstOrFail();

        try {
            app(CertificateIssuer::class)->issueForEnrollment(
                $enrollment,
                $validated['template_id'] ?? null,
            );
        } catch (\DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Certificado emitido correctamente.');
    }
}

