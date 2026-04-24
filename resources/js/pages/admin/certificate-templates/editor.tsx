import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Loader2, Save, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/admin/page-header';
import { FormComboboxSingle, FormImageField, FormInput, FormSwitch, FormTextarea } from '@/components/form';
import {
    buildVisualCertificateHtml,
    extractVisualBodyFromTemplate,
    VisualTemplateEditor,
} from '@/pages/admin/certificate-templates/visual-template-editor';
import { dashboard } from '@/routes';
import * as certificateTemplatesRoute from '@/routes/admin/certificate-templates';
import type { AdminCertificateTemplate, CertificateTemplateCan, CertificateTemplateOption } from '@/types';

const NONE = '';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface Props {
    template: AdminCertificateTemplate | null;
    courseOptions: CertificateTemplateOption[];
    specializationOptions: CertificateTemplateOption[];
    can: CertificateTemplateCan;
}

interface FormData {
    name: string;
    course_id: string;
    specialization_id: string;
    template_html: string;
    background_image_file: File | null;
    signature_image_file: File | null;
    institution_logo_file: File | null;
    remove_background: boolean;
    remove_signature: boolean;
    remove_logo: boolean;
    signatory_name: string;
    signatory_title: string;
    is_active: boolean;
}

function toSelectValue(id: string | null | undefined): string {
    return id && id !== '' ? id : '';
}

export default function CertificateTemplateEditorPage({ template, courseOptions, specializationOptions, can }: Props) {
    const isEditing = template !== null;
    const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
    const [visualBody, setVisualBody] = useState('');

    const { data, setData, post, transform, processing, errors, isDirty, hasErrors, recentlySuccessful } = useForm<FormData>({
        name: template?.name ?? '',
        course_id: toSelectValue(template?.course_id),
        specialization_id: toSelectValue(template?.specialization_id),
        template_html: template?.template_html ?? '',
        background_image_file: null,
        signature_image_file: null,
        institution_logo_file: null,
        remove_background: false,
        remove_signature: false,
        remove_logo: false,
        signatory_name: template?.signatory_name ?? '',
        signatory_title: template?.signatory_title ?? '',
        is_active: template?.is_active ?? true,
    });

    useEffect(() => {
        if (template) {
            const hasVisualMarkers =
                template.template_html.includes('<!--VISUAL_EDITOR_BODY_START-->') &&
                template.template_html.includes('<!--VISUAL_EDITOR_BODY_END-->');
            setEditorMode(hasVisualMarkers ? 'visual' : 'html');
            setVisualBody(extractVisualBodyFromTemplate(template.template_html));

            return;
        }

        const initialVisualBody = '';
        setEditorMode('visual');
        setVisualBody(initialVisualBody);
        setData('template_html', '');
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo inicial
    }, []);

    /** En modo visual el HTML guardado se deriva del cuerpo; el textarea HTML quedaría desactualizado sin esto. */
    useEffect(() => {
        if (editorMode !== 'visual') {
            return;
        }

        setData('template_html', buildVisualCertificateHtml(visualBody));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sincronizar plantilla derivada
    }, [editorMode, visualBody]);

    const templateHasVisualBlock = useMemo(
        () =>
            data.template_html.includes('<!--VISUAL_EDITOR_BODY_START-->') &&
            data.template_html.includes('<!--VISUAL_EDITOR_BODY_END-->'),
        [data.template_html],
    );

    const canUseVisualEditor = useMemo(() => {
        if (templateHasVisualBlock) {
            return true;
        }

        return data.template_html.trim() === '';
    }, [templateHasVisualBlock, data.template_html]);

    const templateContentDirty = useMemo(() => {
        if (!template) {
            if (editorMode === 'visual') {
                return buildVisualCertificateHtml(visualBody) !== buildVisualCertificateHtml('');
            }

            return data.template_html !== '';
        }

        if (editorMode === 'visual') {
            return buildVisualCertificateHtml(visualBody) !== template.template_html;
        }

        return data.template_html !== template.template_html;
    }, [template, editorMode, visualBody, data.template_html]);

    const hasUnsavedChanges = isDirty || templateContentDirty;

    useEffect(() => {
        const onBeforeUnload = (ev: BeforeUnloadEvent) => {
            if (!hasUnsavedChanges || processing) {
                return;
            }

            ev.preventDefault();
            ev.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);

        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [hasUnsavedChanges, processing]);

    const navigateAway = (href: string) => {
        if (hasUnsavedChanges && !processing) {
            const ok = window.confirm('Hay cambios sin guardar. ¿Seguro que quieres salir?');

            if (!ok) {
                return;
            }
        }

        router.visit(href);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payloadTemplate = editorMode === 'visual' ? buildVisualCertificateHtml(visualBody) : data.template_html;
        const opts = { preserveScroll: true };

        if (isEditing && template) {
            transform((form) => ({
                ...form,
                template_html: payloadTemplate,
                course_id: form.course_id === NONE ? '' : form.course_id,
                specialization_id: form.specialization_id === NONE ? '' : form.specialization_id,
                _method: 'put' as const,
            }));
            post(certificateTemplatesRoute.update.url({ certificate_template: template.id }), opts);

            return;
        }

        transform((form) => ({
            ...form,
            template_html: payloadTemplate,
            course_id: form.course_id === NONE ? '' : form.course_id,
            specialization_id: form.specialization_id === NONE ? '' : form.specialization_id,
        }));
        post(certificateTemplatesRoute.store.url(), opts);
    };

    const rejectOversizedImage = (file: File | null): boolean => {
        if (!file || file.size <= MAX_IMAGE_BYTES) {
            return false;
        }

        window.alert(`La imagen supera el máximo de ${MAX_IMAGE_BYTES / (1024 * 1024)} MB. Elige un archivo más pequeño.`);

        return true;
    };

    const saveStatus = processing
        ? { label: 'Guardando…', tone: 'info' as const, Icon: Loader2 }
        : hasErrors
          ? { label: 'Revisa los errores del formulario', tone: 'error' as const, Icon: TriangleAlert }
          : recentlySuccessful
            ? { label: 'Cambios guardados', tone: 'ok' as const, Icon: CheckCircle2 }
            : hasUnsavedChanges
              ? { label: 'Cambios sin guardar', tone: 'warn' as const, Icon: TriangleAlert }
              : null;

    const existingBackground = template?.background_image && !data.remove_background ? `/storage/${template.background_image}` : null;
    const existingSignature = template?.signature_image && !data.remove_signature ? `/storage/${template.signature_image}` : null;
    const existingLogo = template?.institution_logo && !data.remove_logo ? `/storage/${template.institution_logo}` : null;

    const [backgroundObjectUrl, setBackgroundObjectUrl] = useState<string | null>(null);

    useEffect(() => {
        const file = data.background_image_file;

        if (!file) {
            setBackgroundObjectUrl(null);

            return;
        }

        const url = URL.createObjectURL(file);
        setBackgroundObjectUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [data.background_image_file]);

    const certificateBackgroundSrc = useMemo(() => {
        if (data.remove_background) {
            return null;
        }

        return backgroundObjectUrl ?? existingBackground;
    }, [data.remove_background, backgroundObjectUrl, existingBackground]);

    const [signatureObjectUrl, setSignatureObjectUrl] = useState<string | null>(null);

    useEffect(() => {
        const file = data.signature_image_file;

        if (!file) {
            setSignatureObjectUrl(null);

            return;
        }

        const url = URL.createObjectURL(file);
        setSignatureObjectUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [data.signature_image_file]);

    const certificateSignatureSrc = useMemo(() => {
        if (data.remove_signature) {
            return null;
        }

        return signatureObjectUrl ?? existingSignature;
    }, [data.remove_signature, signatureObjectUrl, existingSignature]);

    return (
        <>
            <Head title={isEditing ? `Editor · ${template?.name}` : 'Nueva plantilla de certificado'} />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title={isEditing ? `Editar plantilla: ${template?.name}` : 'Nueva plantilla de certificado'}
                    description="Editor dedicado para diseñar plantillas en modo visual o HTML avanzado."
                    actions={
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            {saveStatus
                                ? (() => {
                                      const StatusIcon = saveStatus.Icon;

                                      return (
                                          <span
                                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                                                  saveStatus.tone === 'ok'
                                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                      : saveStatus.tone === 'error'
                                                        ? 'border-rose-200 bg-rose-50 text-rose-800'
                                                        : saveStatus.tone === 'warn'
                                                          ? 'border-amber-200 bg-amber-50 text-amber-900'
                                                          : 'border-slate-200 bg-slate-50 text-slate-700'
                                              }`}
                                              role="status"
                                              aria-live="polite"
                                          >
                                              <StatusIcon
                                                  className={`size-3.5 shrink-0 ${saveStatus.tone === 'info' ? 'animate-spin' : ''}`}
                                                  aria-hidden
                                              />
                                              {saveStatus.label}
                                          </span>
                                      );
                                  })()
                                : null}
                            <button
                                type="button"
                                onClick={() => navigateAway(certificateTemplatesRoute.index.url())}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                            >
                                <ArrowLeft className="size-4" aria-hidden />
                                Volver al listado
                            </button>
                            {(isEditing ? can.edit : can.create) && (
                                <button
                                    type="submit"
                                    form="certificate-template-editor-form"
                                    disabled={processing}
                                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
                                >
                                    <Save className="size-4" aria-hidden />
                                    {processing ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear plantilla'}
                                </button>
                            )}
                        </div>
                    }
                />

                <form id="certificate-template-editor-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                            <FormInput
                                label="Nombre interno"
                                required
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Ej.: Diploma HTML · plantilla 2026"
                                error={errors.name}
                            />
                            <FormComboboxSingle
                                label="Curso (opcional)"
                                id="certificate-template-course-combobox"
                                options={courseOptions.map((o) => ({ value: o.id, label: o.label }))}
                                value={data.course_id}
                                onValueChange={(v) => {
                                    setData('course_id', v);

                                    if (v !== '') {
                                        setData('specialization_id', NONE);
                                    }
                                }}
                                triggerPlaceholder="Ninguno (plantilla global)"
                                searchPlaceholder="Buscar curso..."
                                emptyText="Ningún curso coincide."
                                hint="Si eliges curso, se borra la especialización. Si no hay plantilla del curso al emitir, se usa la global."
                                error={errors.course_id}
                            />
                            <FormComboboxSingle
                                label="Especialización (opcional)"
                                id="certificate-template-specialization-combobox"
                                options={specializationOptions.map((o) => ({ value: o.id, label: o.label }))}
                                value={data.specialization_id}
                                onValueChange={(v) => {
                                    setData('specialization_id', v);

                                    if (v !== '') {
                                        setData('course_id', NONE);
                                    }
                                }}
                                triggerPlaceholder="Ninguno (plantilla global)"
                                searchPlaceholder="Buscar especialización..."
                                emptyText="Ninguna especialización coincide."
                                hint="Si eliges especialización, se borra el curso. Respaldo: plantilla global si no hay coincidencia."
                                error={errors.specialization_id}
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Diseño de plantilla</p>
                                <p className="text-xs text-slate-500">Dos formas de editar la misma plantilla; elige la que te encaje.</p>
                            </div>
                            <div className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!canUseVisualEditor) {
                                            window.alert(
                                                'Este HTML no incluye los comentarios <!--VISUAL_EDITOR_BODY_START--> … <!--VISUAL_EDITOR_BODY_END-->. El editor visual solo edita ese bloque central. Pega el HTML completo del ejemplo (resources/…/certificado-plantilla-completa-udemy.html) o sigue en HTML avanzado.',
                                            );

                                            return;
                                        }

                                        setVisualBody(extractVisualBodyFromTemplate(data.template_html));
                                        setEditorMode('visual');
                                    }}
                                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                        editorMode === 'visual' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                                    }`}
                                >
                                    Editor visual
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setData('template_html', buildVisualCertificateHtml(visualBody));
                                        setEditorMode('html');
                                    }}
                                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                        editorMode === 'html' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                                    }`}
                                >
                                    HTML avanzado
                                </button>
                            </div>
                        </div>

                        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2.5 text-xs leading-relaxed text-slate-700">
                            <p className="font-semibold text-slate-800">¿Qué hace cada modo?</p>
                            <ul className="mt-1.5 list-inside list-disc space-y-1">
                                <li>
                                    <span className="font-medium text-slate-800">Editor visual:</span> solo el texto del centro
                                    del diploma (en un modal). La app envuelve ese trozo con marco, fondo, firma y QR. Al guardar se
                                    genera el HTML completo.
                                </li>
                                <li>
                                    <span className="font-medium text-slate-800">HTML avanzado:</span> ves y editas el documento
                                    entero. <span className="font-medium">Copiar y pegar aquí sí funciona</span> si pegas un HTML
                                    completo válido (por ejemplo el archivo de ejemplo del proyecto). Si pegas solo un fragmento,
                                    eso es todo lo que guardará el certificado.
                                </li>
                                <li>
                                    Si pasas de HTML a visual, hace falta que el HTML tenga los comentarios{' '}
                                    <code className="rounded bg-white px-0.5 text-[11px]">VISUAL_EDITOR_BODY_*</code> — ahí es donde
                                    el visual lee el centro. Sin ellos, usa solo HTML avanzado.
                                </li>
                            </ul>
                        </div>

                        {editorMode === 'visual' ? (
                            <VisualTemplateEditor
                                value={visualBody}
                                onChange={setVisualBody}
                                certificateBackgroundSrc={certificateBackgroundSrc}
                                certificateSignatureSrc={certificateSignatureSrc}
                            />
                        ) : (
                            <FormTextarea
                                label="Plantilla HTML/CSS"
                                required
                                value={data.template_html}
                                onChange={(e) => setData('template_html', e.target.value)}
                                rows={24}
                                error={errors.template_html}
                                hint="Pega un documento HTML completo (DOCTYPE, head, body) para que vista previa y certificado coincidan. Variables: {{student_name}}, {{course_title}}, {{instructor_name}}, {{completion_date}}, {{total_hours}}, {{verification_code}}, {{verification_url}}, {{qr_url}}, {{background_image_url}}, {{signature_image_url}}, {{institution_logo_url}}, {{signatory_name}}, {{signatory_title}}. Ejemplo en resources/js/pages/admin/certificate-templates/examples/certificado-plantilla-completa-udemy.html"
                                textareaClassName="min-h-[min(70vh,36rem)] resize-y font-mono text-xs"
                            />
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:items-start">
                            <FormImageField
                                label="Fondo"
                                id="cert-tpl-bg"
                                file={data.background_image_file}
                                existingSrc={existingBackground}
                                onFileChange={(f) => {
                                    if (rejectOversizedImage(f)) {
                                        return;
                                    }

                                    setData('background_image_file', f);

                                    if (f) {
                                        setData('remove_background', false);
                                    }
                                }}
                                onClearStored={() => setData('remove_background', true)}
                                hint="JPG, PNG, WebP o GIF. Recomendado horizontal tipo A4 (~3508×2480 px). Máx. 5 MB."
                                error={errors.background_image_file}
                            />
                            <FormImageField
                                label="Firma"
                                id="cert-tpl-signature"
                                file={data.signature_image_file}
                                existingSrc={existingSignature}
                                onFileChange={(f) => {
                                    if (rejectOversizedImage(f)) {
                                        return;
                                    }

                                    setData('signature_image_file', f);

                                    if (f) {
                                        setData('remove_signature', false);
                                    }
                                }}
                                onClearStored={() => setData('remove_signature', true)}
                                hint="PNG con fondo transparente si es posible. Máx. 5 MB."
                                error={errors.signature_image_file}
                            />
                            <FormImageField
                                label="Logo institución"
                                id="cert-tpl-logo"
                                file={data.institution_logo_file}
                                existingSrc={existingLogo}
                                onFileChange={(f) => {
                                    if (rejectOversizedImage(f)) {
                                        return;
                                    }

                                    setData('institution_logo_file', f);

                                    if (f) {
                                        setData('remove_logo', false);
                                    }
                                }}
                                onClearStored={() => setData('remove_logo', true)}
                                hint="Cuadrado o horizontal, buena resolución. Máx. 5 MB."
                                error={errors.institution_logo_file}
                            />
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
                            <FormInput
                                label="Nombre del firmante"
                                value={data.signatory_name}
                                onChange={(e) => setData('signatory_name', e.target.value)}
                                placeholder="Nombre completo"
                                error={errors.signatory_name}
                            />
                            <FormInput
                                label="Cargo del firmante"
                                value={data.signatory_title}
                                onChange={(e) => setData('signatory_title', e.target.value)}
                                placeholder="Directora académica"
                                error={errors.signatory_title}
                            />
                            <FormSwitch
                                label="Plantilla activa"
                                checked={data.is_active}
                                onCheckedChange={(v) => setData('is_active', v)}
                                description={data.is_active ? 'Se puede usar al emitir certificados.' : 'Desactivada en nuevas emisiones.'}
                            />
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

CertificateTemplateEditorPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Plantillas de certificado', href: certificateTemplatesRoute.index.url() },
    ],
};

