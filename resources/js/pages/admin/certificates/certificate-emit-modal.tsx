import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { FormComboboxSingle } from '@/components/form';
import { Modal } from '@/components/ui/modal';
import * as certificatesRoute from '@/routes/admin/certificates';
import type { CertificateTemplateOption, EnrollmentCertificateOption } from '@/types';

interface Props {
    open: boolean;
    onClose: () => void;
    enrollmentOptions: EnrollmentCertificateOption[];
    templateOptions: CertificateTemplateOption[];
}

interface FormData {
    enrollment_id: string;
    template_id: string;
}

export function CertificateEmitModal({ open, onClose, enrollmentOptions, templateOptions }: Props) {
    const { data, setData, post, processing, errors, reset, clearErrors, transform } = useForm<FormData>({
        enrollment_id: '',
        template_id: '',
    });

    useEffect(() => {
        if (!open) {
            return;
        }
        if (enrollmentOptions.length > 0) {
            setData('enrollment_id', enrollmentOptions[0].id);
        }
        setData('template_id', '');
        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- al abrir modal
    }, [open]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((form) => ({
            ...form,
            template_id: form.template_id === '' ? null : form.template_id,
        }));
        post(certificatesRoute.store.url(), { preserveScroll: true, onSuccess: handleClose });
    };

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
                form="certificate-emit-form"
                type="submit"
                disabled={processing || enrollmentOptions.length === 0}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
            >
                {processing ? 'Emitiendo...' : 'Emitir certificado'}
            </button>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Emitir certificado"
            description="Selecciona una matrícula apta y, opcionalmente, una plantilla específica. Si no eliges plantilla, el sistema usará la mejor opción activa."
            size="xl"
            footer={footer}
        >
            <form id="certificate-emit-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormComboboxSingle
                    label="Matrícula apta"
                    required
                    id="cert-emit-enrollment"
                    options={enrollmentOptions.map((o) => ({ value: o.id, label: o.label }))}
                    value={data.enrollment_id}
                    onValueChange={(v) => setData('enrollment_id', v)}
                    triggerPlaceholder={
                        enrollmentOptions.length > 0 ? 'Selecciona una matrícula...' : 'No hay matrículas aptas'
                    }
                    searchPlaceholder="Buscar por curso, alumno o correo..."
                    emptyText="No hay coincidencias."
                    error={errors.enrollment_id}
                    hint="Solo aparecen matrículas activas, con progreso suficiente y sin certificado vigente."
                />

                <FormComboboxSingle
                    label="Plantilla (opcional)"
                    id="cert-emit-template"
                    options={templateOptions.map((o) => ({ value: o.id, label: o.label }))}
                    value={data.template_id}
                    onValueChange={(v) => setData('template_id', v)}
                    triggerPlaceholder="Automática (según curso/especialización)"
                    searchPlaceholder="Buscar plantilla..."
                    emptyText="No hay coincidencias."
                    error={errors.template_id}
                    hint="Deja vacío para selección automática."
                />
            </form>
        </Modal>
    );
}

