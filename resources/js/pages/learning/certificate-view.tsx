import { Head, Link } from '@inertiajs/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ArrowLeft, ChevronDown, Download, FileImage, FileText, Share2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MarketplaceShell } from '@/components/marketplace/marketplace-shell';
import { appToastQueue } from '@/lib/app-toast-queue';
import { formatCourseDurationHours } from '@/lib/format-course-duration';
import { cn } from '@/lib/utils';
import learning from '@/routes/learning';

type CertificateViewProps = {
    enrollment: {
        id: string;
        course_title: string | null;
        progress_pct: number;
        eligible: boolean;
    };
    certificate: {
        id: string;
        student_name: string;
        course_title: string;
        instructor_name: string | null;
        completion_date: string | null;
        issued_at: string | null;
        total_hours: string;
        verification_code: string;
        verification_url: string;
        qr_url: string;
        template: {
            name: string | null;
            rendered_html: string;
            rendered_css: string;
            rendered_body: string;
            background_image_url: string | null;
            signature_image_url: string | null;
            institution_logo_url: string | null;
            signatory_name: string | null;
            signatory_title: string | null;
        };
    } | null;
};

const CERT_VIEW_WIDTH = 1123;
const CERT_VIEW_HEIGHT = 820;

type SidebarCardProps = {
    title: string;
    children: ReactNode;
    className?: string;
};

function SidebarCard({ title, children, className }: SidebarCardProps) {
    return (
        <section className={cn('rounded-2xl border border-slate-200 bg-white p-4 shadow-sm', className)}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
            <div className="mt-3">{children}</div>
        </section>
    );
}

/** Detecta si el HTML/CSS ya referencia el asset (evita duplicar firma/QR por diferencias http/https o host). */
function assetUrlAppearsInMarkup(source: string, absoluteUrl: string | null): boolean {
    if (!absoluteUrl || !source) {
        return false;
    }

    const hay = source.toLowerCase();
    const needle = absoluteUrl.toLowerCase();

    if (hay.includes(needle)) {
        return true;
    }

    try {
        const base = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1';
        const u = new URL(absoluteUrl, base);
        const path = u.pathname.toLowerCase();

        if (path.length > 1 && hay.includes(path)) {
            return true;
        }

        const parts = u.pathname.split('/').filter(Boolean);
        const file = parts[parts.length - 1];

        if (file && file.length > 4 && hay.includes(file.toLowerCase())) {
            return true;
        }
    } catch {
        /* URL inválida: ya probamos includes con needle completo */
    }

    return false;
}

function filenameBase(c: NonNullable<CertificateViewProps['certificate']>): string {
    const safeStudent = c.student_name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    const safeCourse = c.course_title.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');

    return `certificado-${safeStudent || 'alumno'}-${safeCourse || 'curso'}`;
}

/** Misma forma que la vista previa del admin (iframe + documento completo). */
function templateIsFullHtmlDocument(renderedHtml: string): boolean {
    const t = renderedHtml.trim();

    return /^\s*<!doctype\s+html/i.test(renderedHtml) || /^\s*<html[\s>]/i.test(t);
}

export default function LearningCertificateView({ enrollment, certificate }: CertificateViewProps) {
    const certRef = useRef<HTMLDivElement | null>(null);
    const certIframeRef = useRef<HTMLIFrameElement | null>(null);
    const previewHostRef = useRef<HTMLDivElement | null>(null);
    const [exporting, setExporting] = useState(false);
    const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
    const [previewScale, setPreviewScale] = useState(() => {
        if (typeof window === 'undefined') {
            return 1;
        }

        return Math.min(1, (window.innerWidth - 32) / CERT_VIEW_WIDTH);
    });

    const isFullDocument = Boolean(certificate && templateIsFullHtmlDocument(certificate.template.rendered_html));

    const renderedSource = useMemo(() => {
        if (!certificate) {
            return '';
        }

        if (isFullDocument) {
            return certificate.template.rendered_html;
        }

        return `${certificate.template.rendered_css ?? ''}\n${certificate.template.rendered_body ?? ''}`;
    }, [certificate, isFullDocument]);
    const showAutoBackground = Boolean(
        certificate?.template.background_image_url &&
            !assetUrlAppearsInMarkup(renderedSource, certificate.template.background_image_url),
    );
    const showAutoLogo = Boolean(
        certificate?.template.institution_logo_url &&
            !assetUrlAppearsInMarkup(renderedSource, certificate.template.institution_logo_url),
    );
    const showAutoSignature = Boolean(
        certificate?.template.signature_image_url &&
            !assetUrlAppearsInMarkup(renderedSource, certificate.template.signature_image_url),
    );
    const showAutoQr = Boolean(
        certificate?.qr_url &&
            !assetUrlAppearsInMarkup(renderedSource, certificate.qr_url) &&
            !assetUrlAppearsInMarkup(renderedSource, certificate.verification_url),
    );
    const courseDurationLabel = useMemo(() => {
        if (!certificate) {
            return '—';
        }

        const hours = Number.parseFloat(certificate.total_hours);

        return formatCourseDurationHours(hours);
    }, [certificate]);

    useLayoutEffect(() => {
        const host = previewHostRef.current;

        if (!host) {
            return;
        }

        const updateScale = () => {
            const width = host.getBoundingClientRect().width;

            if (!width) {
                return;
            }

            setPreviewScale(Math.min(1, width / CERT_VIEW_WIDTH));
        };

        const raf = window.requestAnimationFrame(updateScale);
        const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScale) : null;
        observer?.observe(host);
        window.addEventListener('resize', updateScale);
        window.addEventListener('orientationchange', updateScale);

        return () => {
            window.cancelAnimationFrame(raf);
            observer?.disconnect();
            window.removeEventListener('resize', updateScale);
            window.removeEventListener('orientationchange', updateScale);
        };
    }, []);

    const getExportRoot = (): HTMLElement | null => {
        if (!certificate) {
            return null;
        }

        if (isFullDocument) {
            const doc = certIframeRef.current?.contentDocument;

            return (doc?.documentElement ?? doc?.body) as HTMLElement | null;
        }

        return certRef.current;
    };

    const downloadImage = async () => {
        const root = getExportRoot();

        if (!root || !certificate) {
            return;
        }

        try {
            setExporting(true);
            const canvas = await html2canvas(root, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                logging: false,
            });
            const dataUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `${filenameBase(certificate)}.png`;
            a.click();
        } catch (error) {
            // Ayuda a diagnosticar errores de canvas/CORS en navegador.
            console.error('Error exportando imagen de certificado:', error);
            appToastQueue.add({ title: 'No se pudo generar la imagen.', variant: 'danger' }, { timeout: 5000 });
        } finally {
            setExporting(false);
        }
    };

    const downloadPdf = async () => {
        const root = getExportRoot();

        if (!root || !certificate) {
            return;
        }

        try {
            setExporting(true);
            const canvas = await html2canvas(root, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                logging: false,
            });
            const dataUrl = canvas.toDataURL('image/png');
            const imageWidth = canvas.width;
            const imageHeight = canvas.height;

            const pdf = new jsPDF({
                orientation: imageWidth >= imageHeight ? 'landscape' : 'portrait',
                unit: 'px',
                format: [imageWidth, imageHeight],
            });
            pdf.addImage(dataUrl, 'PNG', 0, 0, imageWidth, imageHeight);
            pdf.save(`${filenameBase(certificate)}.pdf`);
        } catch (error) {
            console.error('Error exportando PDF de certificado:', error);
            appToastQueue.add({ title: 'No se pudo generar el PDF.', variant: 'danger' }, { timeout: 5000 });
        } finally {
            setExporting(false);
        }
    };

    const shareCertificate = async () => {
        if (!certificate) {
            return;
        }

        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Certificado: ${certificate.course_title}`,
                    text: `Certificado de ${certificate.student_name}`,
                    url: certificate.verification_url,
                });
            } else {
                await navigator.clipboard.writeText(certificate.verification_url);
                appToastQueue.add({ title: 'Enlace copiado para compartir.', variant: 'success' }, { timeout: 3500 });
            }
        } catch (error) {
            // El usuario puede cancelar el diálogo de compartir; evitamos ruido de error.
            if ((error as Error)?.name === 'AbortError') {
                return;
            }

            appToastQueue.add({ title: 'No se pudo compartir el certificado.', variant: 'danger' }, { timeout: 4000 });
        }
    };

    return (
        <MarketplaceShell title="Mi certificado">
            <Head title="Mi certificado" />

            <main className="mx-auto w-full max-w-7xl px-3 pb-8 pt-3 sm:px-4 sm:pt-4">
                <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div>
                        <h1 className="text-base font-bold text-slate-900 sm:text-lg">Certificado del curso</h1>
                        <p className="text-xs text-slate-500 sm:text-sm">
                            {enrollment.course_title ?? 'Curso'} · {Math.round(enrollment.progress_pct)}%
                        </p>
                    </div>
                    <Link
                        href={learning.lessons.show.url({ enrollment: enrollment.id })}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <ArrowLeft className="size-4" />
                        Volver al aula
                    </Link>
                </div>

                {certificate ? (
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:p-4">
                            <div ref={previewHostRef} className="w-full overflow-hidden">
                                <div
                                    className="relative mx-auto w-full max-w-[1123px]"
                                    style={{ height: `${Math.max(CERT_VIEW_HEIGHT * previewScale, 260)}px` }}
                                >
                                    <div
                                        className="absolute left-0 top-0 origin-top-left"
                                        style={{
                                            width: `${CERT_VIEW_WIDTH}px`,
                                            height: `${CERT_VIEW_HEIGHT}px`,
                                            transform: `scale(${previewScale})`,
                                        }}
                                    >
                                        {isFullDocument ? (
                                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow">
                                                <iframe
                                                    ref={certIframeRef}
                                                    title="Certificado"
                                                    srcDoc={certificate.template.rendered_html}
                                                    className="block border-0 bg-white"
                                                    style={{ width: CERT_VIEW_WIDTH, height: CERT_VIEW_HEIGHT }}
                                                />
                                            </div>
                                        ) : (
                                            <div
                                                ref={certRef}
                                                className="relative h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow"
                                                style={
                                                    showAutoBackground
                                                        ? {
                                                              backgroundImage: `url(${certificate.template.background_image_url})`,
                                                              backgroundSize: 'cover',
                                                              backgroundPosition: 'center',
                                                          }
                                                        : undefined
                                                }
                                            >
                                                {certificate.template.rendered_css ? (
                                                    <style>{certificate.template.rendered_css}</style>
                                                ) : null}
                                                <div dangerouslySetInnerHTML={{ __html: certificate.template.rendered_body }} />
                                                {showAutoLogo ? (
                                                    <div className="pointer-events-none absolute left-0 right-0 top-6 z-20 flex justify-center">
                                                        <img
                                                            src={certificate.template.institution_logo_url!}
                                                            alt="Logo institución"
                                                            className="max-h-16 max-w-[220px] object-contain"
                                                        />
                                                    </div>
                                                ) : null}
                                                {showAutoSignature || showAutoQr ? (
                                                    <div className="pointer-events-none absolute inset-x-0 bottom-7 z-20 flex flex-wrap items-end justify-center gap-10 px-6">
                                                        {showAutoSignature ? (
                                                            <div className="flex max-w-[min(100%,280px)] flex-col items-center text-center">
                                                                <img
                                                                    src={certificate.template.signature_image_url!}
                                                                    alt="Firma"
                                                                    className="max-h-20 max-w-[220px] object-contain opacity-95"
                                                                />
                                                                {(certificate.template.signatory_name || certificate.template.signatory_title) && (
                                                                    <div className="-mt-1 text-[12px] text-slate-700">
                                                                        <p className="font-semibold">{certificate.template.signatory_name}</p>
                                                                        <p>{certificate.template.signatory_title}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : null}
                                                        {showAutoQr ? (
                                                            <div className="rounded-xl border border-slate-300 bg-white/96 p-3 text-center shadow-md">
                                                                <img
                                                                    src={certificate.qr_url}
                                                                    alt="QR de verificación pública"
                                                                    className="mx-auto size-24 rounded-md border border-slate-200 bg-white p-1"
                                                                />
                                                                <p className="mt-2 text-[11px] font-semibold tracking-wide text-slate-700">
                                                                    Escanea para verificar
                                                                </p>
                                                                <p className="font-mono text-[10px] font-bold tracking-wider text-blue-700">
                                                                    {certificate.verification_code}
                                                                </p>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <aside className="space-y-3 xl:sticky xl:top-4">
                            <SidebarCard title="Destinatario del certificado">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-11 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                        {certificate.student_name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{certificate.student_name}</p>
                                        <p className="text-xs text-slate-500">
                                            {certificate.completion_date ? `Finalizó: ${certificate.completion_date}` : 'Certificado emitido'}
                                        </p>
                                    </div>
                                </div>
                            </SidebarCard>

                            <SidebarCard title="Acerca del curso">
                                <h3 className="text-sm font-bold text-slate-900">{certificate.course_title}</h3>
                                <p className="mt-1 text-xs text-slate-500">Instructor: {certificate.instructor_name ?? 'No especificado'}</p>
                                <p className="mt-1 text-xs text-slate-500">Horas acreditadas: {courseDurationLabel}</p>
                                <a
                                    href={certificate.verification_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
                                >
                                    <Download className="size-3.5" />
                                    Verificación pública
                                </a>
                            </SidebarCard>

                            <SidebarCard title="Descargas y acciones">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDownloadMenuOpen((open) => !open)}
                                        className="col-span-2 inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                    >
                                        <Download className="size-4" />
                                        Descargar
                                        <ChevronDown className={cn('size-4 transition-transform', downloadMenuOpen ? 'rotate-180' : '')} />
                                    </button>

                                    {downloadMenuOpen ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => void downloadImage()}
                                                disabled={exporting}
                                                className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                            >
                                                <FileImage className="size-4" />
                                                .png
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void downloadPdf()}
                                                disabled={exporting}
                                                className="inline-flex items-center justify-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                                            >
                                                <FileText className="size-4" />
                                                .pdf
                                            </button>
                                        </>
                                    ) : null}

                                    <button
                                        type="button"
                                        onClick={() => void shareCertificate()}
                                        className="col-span-2 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        <Share2 className="size-4" />
                                        Compartir
                                    </button>
                                </div>
                                <p className="mt-3 text-xs text-slate-500">Los formatos se muestran solo al pulsar “Descargar”.</p>
                            </SidebarCard>
                        </aside>
                    </div>
                ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                        Aún no tienes un certificado generado para esta matrícula.
                        {enrollment.eligible ? ' Vuelve al aula y usa el botón "Generar certificado".' : ' Debes completar el curso al 100%.'}
                    </div>
                )}
            </main>
        </MarketplaceShell>
    );
}

