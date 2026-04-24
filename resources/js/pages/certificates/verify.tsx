import { Head } from '@inertiajs/react';
import { BadgeCheck, QrCode, ShieldAlert } from 'lucide-react';

interface CertificateData {
    verification_code: string;
    verification_url: string;
    student_name: string;
    course_title: string;
    instructor_name: string | null;
    completion_date: string | null;
    issued_at: string | null;
    is_revoked: boolean;
    revoked_reason: string | null;
    template_name: string | null;
    pdf_path: string | null;
    qr_url: string;
}

interface Props {
    found: boolean;
    code?: string;
    certificate?: CertificateData;
}

export default function VerifyCertificatePage({ found, code, certificate }: Props) {
    if (!found || !certificate) {
        return (
            <>
                <Head title="Certificado no encontrado" />
                <main className="min-h-screen bg-slate-50 px-4 py-16">
                    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <ShieldAlert className="mx-auto size-10 text-rose-500" />
                        <h1 className="mt-3 text-2xl font-bold text-slate-900">Código no válido</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            No se encontró un certificado con el código <span className="font-mono">{code ?? '—'}</span>.
                        </p>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Head title={`Verificación · ${certificate.verification_code}`} />
            <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
                <div className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                        <div className="flex items-start gap-3">
                            <BadgeCheck className="mt-0.5 size-6 text-emerald-500" />
                            <div className="min-w-0">
                                <h1 className="text-2xl font-bold text-slate-900">Certificado verificado</h1>
                                <p className="mt-1 text-sm text-slate-600">
                                    Código: <span className="font-mono font-semibold">{certificate.verification_code}</span>
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Estudiante</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{certificate.student_name}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Curso</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{certificate.course_title}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Instructor</p>
                                <p className="mt-1 text-sm text-slate-800">{certificate.instructor_name ?? '—'}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Fecha emisión</p>
                                <p className="mt-1 text-sm text-slate-800">
                                    {certificate.issued_at
                                        ? new Date(certificate.issued_at).toLocaleDateString('es-PE', {
                                              day: '2-digit',
                                              month: 'long',
                                              year: 'numeric',
                                          })
                                        : '—'}
                                </p>
                            </div>
                        </div>

                        {certificate.is_revoked ? (
                            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3">
                                <p className="text-sm font-semibold text-rose-800">Este certificado fue revocado</p>
                                <p className="mt-1 text-xs text-rose-700">{certificate.revoked_reason ?? 'Sin motivo especificado.'}</p>
                            </div>
                        ) : (
                            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                                Certificado vigente y válido.
                            </div>
                        )}
                    </section>

                    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <QrCode className="size-4 text-blue-600" />
                            QR de verificación
                        </div>
                        <img
                            src={certificate.qr_url}
                            alt="Código QR de verificación"
                            className="mx-auto mt-4 size-56 rounded-xl border border-slate-100 bg-white object-contain"
                        />
                        <p className="mt-3 break-all text-[11px] text-slate-500">{certificate.verification_url}</p>
                    </aside>
                </div>
            </main>
        </>
    );
}

