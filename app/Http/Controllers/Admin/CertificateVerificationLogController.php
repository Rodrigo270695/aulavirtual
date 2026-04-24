<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\CertificateVerification;
use Inertia\Inertia;
use Inertia\Response;

class CertificateVerificationLogController extends Controller
{
    public function index(Certificate $certificate): Response
    {
        $this->authorize('certificados_emitidos.verifications');

        $sortBy = request('sort_by');
        $sortDir = request('sort_dir') === 'asc' ? 'asc' : 'desc';

        $verifications = CertificateVerification::query()
            ->where('certificate_id', $certificate->id)
            ->when(
                trim((string) request('search', '')) !== '',
                function ($query): void {
                    $needle = trim((string) request('search'));
                    $query->where(function ($q) use ($needle): void {
                        $q->where('ip_address', 'ilike', "%{$needle}%")
                            ->orWhere('user_agent', 'ilike', "%{$needle}%");
                    });
                }
            )
            ->when(
                in_array($sortBy, ['verified_at', 'ip_address'], true),
                fn ($q) => $q->orderBy($sortBy, $sortDir),
                fn ($q) => $q->orderByDesc('verified_at')
            )
            ->paginate((int) request('per_page', 25))
            ->withQueryString()
            ->through(fn (CertificateVerification $v): array => [
                'id' => $v->id,
                'ip_address' => $v->ip_address,
                'user_agent' => $v->user_agent,
                'verified_at' => $v->verified_at?->toIso8601String(),
            ]);

        $filters = request()->only(['search', 'per_page', 'sort_by', 'sort_dir']);

        return Inertia::render('admin/certificates/verifications/index', [
            'certificate' => [
                'id' => $certificate->id,
                'verification_code' => $certificate->verification_code,
                'verification_url' => $certificate->verification_url,
                'student_name' => $certificate->student_name,
                'course_title' => $certificate->course_title,
                'is_revoked' => (bool) $certificate->is_revoked,
                'issued_at' => $certificate->issued_at?->toIso8601String(),
            ],
            'verifications' => $verifications,
            'filters' => $filters,
        ]);
    }
}
