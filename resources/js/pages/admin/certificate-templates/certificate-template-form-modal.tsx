/**
 * Modal crear/editar plantilla de certificado (HTML + alcance curso/especialización).
 */

import { useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { FormComboboxSingle, FormImageField, FormInput, FormSwitch, FormTextarea } from '@/components/form';
import { Modal } from '@/components/ui/modal';
import {
    buildVisualCertificateHtml,
    extractVisualBodyFromTemplate,
    VisualTemplateEditor,
} from '@/pages/admin/certificate-templates/visual-template-editor';
import * as certificateTemplatesRoute from '@/routes/admin/certificate-templates';
import type { AdminCertificateTemplate, CertificateTemplateOption } from '@/types';

const NONE = '';

interface Props {
    open: boolean;
    onClose: () => void;
    template: AdminCertificateTemplate | null;
    courseOptions: CertificateTemplateOption[];
    specializationOptions: CertificateTemplateOption[];
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

export function CertificateTemplateFormModal({
    open,
    onClose,
    template,
    courseOptions,
    specializationOptions,
}: Props) {
    const isEditing = template !== null;
    const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
    const [visualBody, setVisualBody] = useState('');

    const { data, setData, post, transform, processing, errors, reset, clearErrors } = useForm<FormData>({
        name: '',
        course_id: NONE,
        specialization_id: NONE,
        template_html: '',
        background_image_file: null,
        signature_image_file: null,
        institution_logo_file: null,
        remove_background: false,
        remove_signature: false,
        remove_logo: false,
        signatory_name: '',
        signatory_title: '',
        is_active: true,
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        if (template) {
            const hasVisualMarkers =
                template.template_html.includes('<!--VISUAL_EDITOR_BODY_START-->') &&
                template.template_html.includes('<!--VISUAL_EDITOR_BODY_END-->');
            setData({
                name: template.name,
                course_id: toSelectValue(template.course_id),
                specialization_id: toSelectValue(template.specialization_id),
                template_html: template.template_html,
                background_image_file: null,
                signature_image_file: null,
                institution_logo_file: null,
                remove_background: false,
                remove_signature: false,
                remove_logo: false,
                signatory_name: template.signatory_name ?? '',
                signatory_title: template.signatory_title ?? '',
                is_active: template.is_active,
            });
            setEditorMode(hasVisualMarkers ? 'visual' : 'html');
            setVisualBody(extractVisualBodyFromTemplate(template.template_html));
        } else {
            const initialVisualBody = extractVisualBodyFromTemplate('');
            setData({
                name: '',
                course_id: NONE,
                specialization_id: NONE,
                template_html: buildVisualCertificateHtml(initialVisualBody),
                background_image_file: null,
                signature_image_file: null,
                institution_logo_file: null,
                remove_background: false,
                remove_signature: false,
                remove_logo: false,
                signatory_name: '',
                signatory_title: '',
                is_active: true,
            });
            setEditorMode('visual');
            setVisualBody(initialVisualBody);
        }

        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sincronizar al abrir
    }, [open, template]);

    useEffect(() => {
        if (editorMode !== 'visual') {
            return;
        }

        setData('template_html', buildVisualCertificateHtml(visualBody));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sincronizar html derivado
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

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const opts = { onSuccess: handleClose, preserveScroll: true };
        const templateHtmlPayload = editorMode === 'visual' ? buildVisualCertificateHtml(visualBody) : data.template_html;

        if (isEditing && template) {
            transform((form) => ({
                ...form,
                template_html: templateHtmlPayload,
                course_id: form.course_id === NONE ? '' : form.course_id,
                specialization_id: form.specialization_id === NONE ? '' : form.specialization_id,
                _method: 'put' as const,
            }));
            post(certificateTemplatesRoute.update.url({ certificate_template: template.id }), opts);
        } else {
            transform((form) => ({
                ...form,
                template_html: templateHtmlPayload,
                course_id: form.course_id === NONE ? '' : form.course_id,
                specialization_id: form.specialization_id === NONE ? '' : form.specialization_id,
            }));
            post(certificateTemplatesRoute.store.url(), opts);
        }
    };

    const existingBackground =
        template?.background_image && !data.remove_background ? `/storage/${template.background_image}` : null;
    const existingSignature =
        template?.signature_image && !data.remove_signature ? `/storage/${template.signature_image}` : null;
    const existingLogo =
        template?.institution_logo && !data.remove_logo ? `/storage/${template.institution_logo}` : null;

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

    const footer = (
        <div className="flex w-full flex-wrap items-center justify-end gap-3">
            <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-slate-300/90 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50"
            >
                Cancelar
            </button>
            <button
                form="certificate-template-form"
                type="submit"
                disabled={processing}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
            >
                {processing ? 'Guardando...' : isEditing ? 'Actualizar plantilla' : 'Crear plantilla'}
            </button>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isEditing ? `Editar: ${template?.name ?? 'plantilla'}` : 'Nueva plantilla de certificado'}
            description={
                isEditing
                    ? 'Modifica el HTML, el alcance (un curso, una especialización o global) y los metadatos visuales.'
                    : 'Define el diseño en HTML/CSS y, si aplica, vincúlalo a un curso o a una especialización.'
            }
            size="xl"
            footer={footer}
        >
            <form id="certificate-template-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormInput
                    label="Nombre interno"
                    required
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Ej.: Diploma HTML · plantilla 2026"
                    error={errors.name}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                        error={errors.course_id}
                        hint="Si eliges curso, no selecciones especialización."
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
                        error={errors.specialization_id}
                        hint="Si eliges especialización, no selecciones curso."
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-slate-800">Diseño de plantilla</p>
                        <div className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-1">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!canUseVisualEditor) {
                                        window.alert(
                                            'Este HTML no incluye <!--VISUAL_EDITOR_BODY_START--> … <!--VISUAL_EDITOR_BODY_END-->. El editor visual solo edita ese bloque. Usa HTML avanzado o pega una plantilla completa del ejemplo del proyecto.',
                                        );

                                        return;
                                    }

                                    setVisualBody(extractVisualBodyFromTemplate(data.template_html));
                                    setEditorMode('visual');
                                }}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                    editorMode === 'visual'
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800'
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
                                    editorMode === 'html'
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                HTML avanzado
                            </button>
                        </div>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                        <span className="font-semibold text-slate-700">Visual</span> = centro del diploma en modal;{' '}
                        <span className="font-semibold text-slate-700">HTML</span> = documento completo. Al pasar de HTML a
                        visual se importa el bloque entre los comentarios VISUAL_EDITOR_BODY. Copiar y pegar HTML completo sí
                        funciona.
                    </p>

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
                            rows={14}
                            error={errors.template_html}
                            hint="Variables disponibles: {{student_name}}, {{course_title}}, {{instructor_name}}, {{completion_date}}, {{total_hours}}, {{verification_code}}, {{verification_url}}, {{qr_url}}, {{background_image_url}}, {{signature_image_url}}, {{institution_logo_url}}, {{signatory_name}}, {{signatory_title}}."
                            textareaClassName="font-mono text-xs"
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-start">
                    <FormImageField
                        label="Fondo"
                        id="cert-tpl-bg"
                        file={data.background_image_file}
                        existingSrc={existingBackground}
                        onFileChange={(f) => {
                            setData('background_image_file', f);

                            if (f) {
                                setData('remove_background', false);
                            }
                        }}
                        onClearStored={() => setData('remove_background', true)}
                        hint="JPG, PNG, WebP o GIF. Máx. 5 MB."
                        error={errors.background_image_file}
                    />
                    <FormImageField
                        label="Firma"
                        id="cert-tpl-signature"
                        file={data.signature_image_file}
                        existingSrc={existingSignature}
                        onFileChange={(f) => {
                            setData('signature_image_file', f);

                            if (f) {
                                setData('remove_signature', false);
                            }
                        }}
                        onClearStored={() => setData('remove_signature', true)}
                        hint="Imagen de la firma escaneada."
                        error={errors.signature_image_file}
                    />
                    <FormImageField
                        label="Logo institución"
                        id="cert-tpl-logo"
                        file={data.institution_logo_file}
                        existingSrc={existingLogo}
                        onFileChange={(f) => {
                            setData('institution_logo_file', f);

                            if (f) {
                                setData('remove_logo', false);
                            }
                        }}
                        onClearStored={() => setData('remove_logo', true)}
                        hint="Logo para el encabezado del diploma."
                        error={errors.institution_logo_file}
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                </div>

                <FormSwitch
                    label="Plantilla activa"
                    checked={data.is_active}
                    onCheckedChange={(v) => setData('is_active', v)}
                    description={data.is_active ? 'Se puede usar al emitir certificados.' : 'Desactivada: no se ofrece en nuevas emisiones.'}
                />
            </form>
        </Modal>
    );
}
