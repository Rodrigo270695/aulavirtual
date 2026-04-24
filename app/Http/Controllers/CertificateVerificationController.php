<?php

namespace App\Http\Controllers;

use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use App\Models\Certificate;
use App\Models\CertificateVerification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CertificateVerificationController extends Controller
{
    public function show(Request $request, string $code): Response
    {
        $certificate = Certificate::query()
            ->with('template:id,name')
            ->where('verification_code', $code)
            ->first();

        if ($certificate === null) {
            return Inertia::render('certificates/verify', [
                'found' => false,
                'code' => $code,
            ])->toResponse($request)->setStatusCode(404);
        }

        CertificateVerification::query()->create([
            'certificate_id' => $certificate->id,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 2000),
            'verified_at' => now(),
        ]);

        return Inertia::render('certificates/verify', [
            'found' => true,
            'certificate' => [
                'verification_code' => $certificate->verification_code,
                'verification_url' => $certificate->verification_url,
                'student_name' => $certificate->student_name,
                'course_title' => $certificate->course_title,
                'instructor_name' => $certificate->instructor_name,
                'completion_date' => $certificate->completion_date instanceof \DateTimeInterface
                    ? $certificate->completion_date->format('d/m/Y')
                    : ($certificate->completion_date ? (string) $certificate->completion_date : null),
                'issued_at' => $certificate->issued_at?->toIso8601String(),
                'is_revoked' => (bool) $certificate->is_revoked,
                'revoked_reason' => $certificate->revoked_reason,
                'template_name' => $certificate->template?->name,
                'pdf_path' => $certificate->pdf_path,
                'qr_url' => route('certificates.qr', ['code' => $certificate->verification_code], false),
            ],
        ])->toResponse($request);
    }

    public function qr(string $code): \Illuminate\Http\Response
    {
        $certificate = Certificate::query()
            ->where('verification_code', $code)
            ->firstOrFail();

        $writer = new PngWriter();
        $qrCode = new QrCode(
            data: (string) $certificate->verification_url,
            size: 260,
            margin: 0,
        );
        $qr = $writer->write($qrCode);

        return response($qr->getString(), 200, [
            'Content-Type' => $qr->getMimeType(),
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}

