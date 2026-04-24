<?php

namespace App\Http\Controllers\Learning;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Enrollment;
use App\Support\CertificateIssuer;
use App\Support\CoursePublishedContentDuration;
use App\Support\VisualCertificateHtml;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StudentCertificateController extends Controller
{
    public function show(Request $request, Enrollment $enrollment): Response
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_if($enrollment->user_id !== $user->id || $enrollment->status !== 'active' || $enrollment->course_id === null, 404);

        $enrollment->loadMissing('course:id,title');

        $certificate = Certificate::query()
            ->with([
                'template:id,name,template_html,background_image,signature_image,institution_logo,signatory_name,signatory_title',
                'user:id,first_name,last_name',
                'course:id,duration_hours',
            ])
            ->where('enrollment_id', $enrollment->id)
            ->where('is_revoked', false)
            ->first();

        return Inertia::render('learning/certificate-view', [
            'enrollment' => [
                'id' => $enrollment->id,
                'course_title' => $enrollment->course?->title,
                'progress_pct' => round((float) $enrollment->progress_pct, 2),
                'eligible' => round((float) $enrollment->progress_pct, 2) >= 99.5,
            ],
            'certificate' => $certificate ? $this->serializeCertificate($certificate) : null,
        ]);
    }

    public function generate(Request $request, Enrollment $enrollment): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_if($enrollment->user_id !== $user->id || $enrollment->status !== 'active' || $enrollment->course_id === null, 404);

        try {
            app(CertificateIssuer::class)->issueForEnrollment($enrollment);
        } catch (\DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return to_route('learning.certificate.show', ['enrollment' => $enrollment->id])
            ->with('success', 'Tu certificado se generó correctamente.');
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeCertificate(Certificate $certificate): array
    {
        $template = $certificate->template;
        $verificationUrl = $certificate->verification_url;
        $qrUrl = route('certificates.qr', ['code' => $certificate->verification_code], false);
        $backgroundImageUrl = $template?->background_image ? asset('storage/'.$template->background_image) : null;
        $signatureImageUrl = $template?->signature_image ? asset('storage/'.$template->signature_image) : null;
        $logoImageUrl = $template?->institution_logo ? asset('storage/'.$template->institution_logo) : null;
        $totalHours = round((float) ($certificate->total_hours ?? 0), 2);
        if ($totalHours <= 0) {
            $courseHours = round((float) ($certificate->course?->duration_hours ?? 0), 2);
            $publishedByCourse = $certificate->course_id
                ? CoursePublishedContentDuration::publishedSecondsByCourseId([(string) $certificate->course_id])
                : [];
            $publishedSeconds = (int) ($publishedByCourse[(string) $certificate->course_id] ?? 0);
            $publishedHours = $publishedSeconds > 0 ? round($publishedSeconds / 3600, 2) : 0.0;

            if ($courseHours > 0) {
                $totalHours = $courseHours;
            }

            $totalHours = max($totalHours, $publishedHours);
        }
        $totalHoursLabel = number_format($totalHours, 2, '.', '');
        $completionDate = $this->formatDateDmy(
            $certificate->completion_date instanceof \DateTimeInterface
                ? $certificate->completion_date
                : ($certificate->completion_date ? (string) $certificate->completion_date : null)
        );
        $completionDateIso = $certificate->completion_date instanceof \DateTimeInterface
            ? $certificate->completion_date->format('Y-m-d')
            : ($certificate->completion_date ? (string) $certificate->completion_date : '');
        $issuedDate = $this->formatDateDmy(
            $certificate->issued_at instanceof \DateTimeInterface
                ? $certificate->issued_at
                : ($certificate->issued_at ? (string) $certificate->issued_at : null)
        );
        $issuedDateIso = $certificate->issued_at instanceof \DateTimeInterface
            ? $certificate->issued_at->format('Y-m-d')
            : ($certificate->issued_at ? (string) $certificate->issued_at : '');

        $displayStudentName = $this->displayStudentNameForCertificate($certificate);

        $rawTemplate = (string) ($template?->template_html ?? '');

        if ($rawTemplate !== ''
            && str_contains($rawTemplate, '<!--VISUAL_EDITOR_BODY_START-->')
            && str_contains($rawTemplate, '<!--VISUAL_EDITOR_BODY_END-->')
            && preg_match('/<!--VISUAL_EDITOR_BODY_START-->([\s\S]*?)<!--VISUAL_EDITOR_BODY_END-->/i', $rawTemplate, $visualMatch)
        ) {
            $visualBody = trim((string) ($visualMatch[1] ?? ''));
            $rawTemplate = VisualCertificateHtml::wrap($visualBody);
        }

        $renderedHtml = strtr($rawTemplate, [
            '{{student_name}}' => $displayStudentName,
            '{{course_title}}' => (string) $certificate->course_title,
            '{{instructor_name}}' => (string) ($certificate->instructor_name ?? ''),
            '{{completion_date}}' => $completionDate,
            '{{completion_date_iso}}' => $completionDateIso,
            '{{total_hours}}' => $totalHoursLabel,
            '{{verification_code}}' => (string) $certificate->verification_code,
            '{{verification_url}}' => (string) $verificationUrl,
            '{{qr_url}}' => $qrUrl,
            '{{issued_at}}' => $issuedDate,
            '{{issued_at_iso}}' => $issuedDateIso,
            '{{background_image_url}}' => (string) ($backgroundImageUrl ?? ''),
            '{{signature_image_url}}' => (string) ($signatureImageUrl ?? ''),
            '{{institution_logo_url}}' => (string) ($logoImageUrl ?? ''),
            '{{logo_url}}' => (string) ($logoImageUrl ?? ''),
            '{{signature_url}}' => (string) ($signatureImageUrl ?? ''),
            '{{signatory_name}}' => (string) ($template?->signatory_name ?? ''),
            '{{signatory_title}}' => (string) ($template?->signatory_title ?? ''),
        ]);

        [$renderedCss, $renderedBody] = $this->normalizeTemplateParts($renderedHtml);

        return [
            'id' => $certificate->id,
            'student_name' => $displayStudentName,
            'course_title' => $certificate->course_title,
            'instructor_name' => $certificate->instructor_name,
            'completion_date' => $completionDate !== '' ? $completionDate : null,
            'issued_at' => $certificate->issued_at?->toIso8601String(),
            'total_hours' => $totalHoursLabel,
            'verification_code' => $certificate->verification_code,
            'verification_url' => $verificationUrl,
            'qr_url' => $qrUrl,
            'template' => [
                'name' => $template?->name,
                'rendered_html' => $renderedHtml,
                'rendered_css' => $renderedCss,
                'rendered_body' => $renderedBody,
                'background_image_url' => $backgroundImageUrl,
                'signature_image_url' => $signatureImageUrl,
                'institution_logo_url' => $logoImageUrl,
                'signatory_name' => $template?->signatory_name,
                'signatory_title' => $template?->signatory_title,
            ],
        ];
    }

    /**
     * Nombre para el HTML del certificado: prioriza el perfil actual del usuario (cambios de mayúsculas/nombre)
     * y normaliza capitalización. El valor almacenado en `certificates.student_name` sigue siendo el de la emisión.
     */
    private function displayStudentNameForCertificate(Certificate $certificate): string
    {
        $fromUser = '';
        if ($certificate->relationLoaded('user') && $certificate->user !== null) {
            $fromUser = trim(($certificate->user->first_name ?? '').' '.($certificate->user->last_name ?? ''));
        }

        $raw = $fromUser !== '' ? $fromUser : trim((string) $certificate->student_name);
        if ($raw === '') {
            return '';
        }

        return Str::title(Str::lower($raw));
    }

    /**
     * @return array{0:string,1:string}
     */
    private function normalizeTemplateParts(string $renderedHtml): array
    {
        $css = '';
        if (preg_match_all('/<style[^>]*>(.*?)<\/style>/is', $renderedHtml, $matches)) {
            $css = trim(implode("\n", $matches[1] ?? []));
        }

        if (preg_match('/<body[^>]*>(.*?)<\/body>/is', $renderedHtml, $bodyMatch)) {
            $body = trim($bodyMatch[1]);
        } else {
            $body = preg_replace('/<!doctype.*?>/is', '', $renderedHtml) ?? $renderedHtml;
            $body = preg_replace('/<head[^>]*>.*?<\/head>/is', '', $body) ?? $body;
            $body = preg_replace('/<html[^>]*>|<\/html>/is', '', $body) ?? $body;
            $body = preg_replace('/<style[^>]*>.*?<\/style>/is', '', $body) ?? $body;
            $body = trim($body);
        }

        return [$css, $body];
    }

    /**
     * Fuerza formato de salida dd/mm/yyyy para fechas usadas en plantilla.
     */
    private function formatDateDmy(\DateTimeInterface|string|null $value): string
    {
        if ($value === null) {
            return '';
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('d/m/Y');
        }

        $raw = trim($value);
        if ($raw === '') {
            return '';
        }

        if (preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $raw) === 1) {
            return $raw;
        }

        try {
            return Carbon::parse($raw)->format('d/m/Y');
        } catch (\Throwable) {
            return $raw;
        }
    }
}

