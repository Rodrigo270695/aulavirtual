<?php

namespace App\Support;

use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Enrollment;
use Illuminate\Support\Str;

class CertificateIssuer
{
    public function issueForEnrollment(Enrollment $enrollment, ?string $requestedTemplateId = null): Certificate
    {
        $enrollment->loadMissing([
            'user:id,first_name,last_name,email',
            'course:id,title,duration_hours,completion_threshold,certificate_enabled,instructor_id',
            'course.instructor.user:id,first_name,last_name',
        ]);

        $existing = Certificate::query()
            ->where('enrollment_id', $enrollment->id)
            ->where('is_revoked', false)
            ->first();
        if ($existing !== null) {
            return $existing;
        }

        $this->assertEligible($enrollment);

        $template = $this->resolveTemplate(
            $requestedTemplateId,
            (string) $enrollment->course_id,
            $enrollment->specialization_id ? (string) $enrollment->specialization_id : null,
        );
        if ($template === null) {
            throw new \DomainException('No hay plantilla activa aplicable para esta matrícula.');
        }

        $code = $this->nextVerificationCode();
        $verificationUrl = route('certificates.verify', ['code' => $code]);

        $studentName = trim(($enrollment->user?->first_name ?? '').' '.($enrollment->user?->last_name ?? ''));
        $instructorName = trim(($enrollment->course?->instructor?->user?->first_name ?? '').' '.($enrollment->course?->instructor?->user?->last_name ?? ''));

        return Certificate::query()->create([
            'user_id' => $enrollment->user_id,
            'enrollment_id' => $enrollment->id,
            'template_id' => $template->id,
            'course_id' => $enrollment->course_id,
            'specialization_id' => $enrollment->specialization_id,
            'verification_code' => $code,
            'verification_url' => $verificationUrl,
            'student_name' => $studentName !== '' ? $studentName : ($enrollment->user?->email ?? 'Estudiante'),
            'course_title' => $enrollment->course?->title ?? 'Curso',
            'instructor_name' => $instructorName !== '' ? $instructorName : null,
            'completion_date' => $enrollment->completed_at?->toDateString() ?? now()->toDateString(),
            'total_hours' => $this->resolveTotalHours($enrollment),
            'final_score' => null,
            'issued_at' => now(),
        ]);
    }

    public function assertEligible(Enrollment $enrollment): void
    {
        if ($enrollment->status !== 'active' || $enrollment->course_id === null || $enrollment->course === null) {
            throw new \DomainException('La matrícula no es válida para emitir certificado.');
        }

        if (! (bool) $enrollment->course->certificate_enabled) {
            throw new \DomainException('Este curso no tiene habilitada la emisión de certificados.');
        }

        $threshold = (float) ($enrollment->course->completion_threshold ?? 99.5);
        if ((float) $enrollment->progress_pct + 0.0001 < $threshold) {
            throw new \DomainException("El estudiante aún no alcanza el umbral de finalización ({$threshold}%).");
        }
    }

    private function resolveTemplate(?string $requestedTemplateId, string $courseId, ?string $specializationId): ?CertificateTemplate
    {
        if ($requestedTemplateId) {
            $requested = CertificateTemplate::query()
                ->whereKey($requestedTemplateId)
                ->where('is_active', true)
                ->first();
            if ($requested === null) {
                return null;
            }
            if ($requested->course_id !== null && $requested->course_id !== $courseId) {
                return null;
            }
            if ($requested->specialization_id !== null && $requested->specialization_id !== $specializationId) {
                return null;
            }

            return $requested;
        }

        return CertificateTemplate::query()
            ->where('is_active', true)
            ->where(function ($q) use ($courseId, $specializationId): void {
                $q->where('course_id', $courseId);
                if ($specializationId !== null) {
                    $q->orWhere('specialization_id', $specializationId);
                }
                $q->orWhere(function ($qq): void {
                    $qq->whereNull('course_id')->whereNull('specialization_id');
                });
            })
            ->orderByRaw('CASE WHEN course_id IS NOT NULL THEN 0 WHEN specialization_id IS NOT NULL THEN 1 ELSE 2 END')
            ->orderByDesc('updated_at')
            ->first();
    }

    private function nextVerificationCode(): string
    {
        do {
            $code = strtoupper(Str::random(12));
        } while (Certificate::query()->where('verification_code', $code)->exists());

        return $code;
    }

    private function resolveTotalHours(Enrollment $enrollment): float
    {
        $courseId = $enrollment->course_id;
        if ($courseId === null) {
            return 0.0;
        }

        $courseHours = round((float) ($enrollment->course?->duration_hours ?? 0), 2);
        $publishedByCourse = CoursePublishedContentDuration::publishedSecondsByCourseId([(string) $courseId]);
        $publishedSeconds = (int) ($publishedByCourse[(string) $courseId] ?? 0);
        $publishedHours = $publishedSeconds > 0 ? round($publishedSeconds / 3600, 2) : 0.0;

        return max($courseHours, $publishedHours);
    }
}

