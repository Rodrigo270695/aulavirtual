import { useForm } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import { useEffect } from 'react';
import { FormComboboxMulti, FormInput, FormSelect, FormSwitch } from '@/components/form';
import { Modal } from '@/components/ui/modal';
import * as credentialsRoute from '@/routes/admin/instructor-credentials';
import type { AdminInstructorCredential, CredentialTypeOption, InstructorUserOption } from '@/types';

interface Props {
    open: boolean;
    onClose: () => void;
    credential: AdminInstructorCredential | null;
    instructorOptions: InstructorUserOption[];
    credentialTypeOptions: CredentialTypeOption[];
    canManageAll: boolean;
    canVerify: boolean;
}

interface FormData {
    instructor_id: string;
    credential_type: string;
    title: string;
    institution: string;
    obtained_date: string;
    expiry_date: string;
    credential_url: string;
    document_file: File | null;
    is_verified: boolean;
}

export function CredentialFormModal({
    open,
    onClose,
    credential,
    instructorOptions,
    credentialTypeOptions,
    canManageAll,
    canVerify,
}: Props) {
    const isEditing = credential !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        instructor_id: '',
        credential_type: 'degree',
        title: '',
        institution: '',
        obtained_date: '',
        expiry_date: '',
        credential_url: '',
        document_file: null,
        is_verified: false,
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        if (credential) {
            setData({
                instructor_id: credential.instructor_id,
                credential_type: credential.credential_type,
                title: credential.title,
                institution: credential.institution,
                obtained_date: credential.obtained_date ?? '',
                expiry_date: credential.expiry_date ?? '',
                credential_url: credential.credential_url ?? '',
                document_file: null,
                is_verified: credential.is_verified,
            });
        } else {
            setData({
                instructor_id: canManageAll ? '' : (instructorOptions[0]?.id ?? ''),
                credential_type: 'degree',
                title: '',
                institution: '',
                obtained_date: '',
                expiry_date: '',
                credential_url: '',
                document_file: null,
                is_verified: false,
            });
        }

        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sincronizar al abrir
    }, [open, credential, canManageAll, instructorOptions]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: handleClose };

        if (isEditing && credential) {
            put(credentialsRoute.update.url({ instructorCredential: credential.id }), options);
        } else {
            post(credentialsRoute.store.url(), options);
        }
    };

    const existingDocHref =
        credential?.document_path != null && credential.document_path !== ''
            ? `/storage/${credential.document_path}`
            : null;

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
                form="credential-form"
                type="submit"
                disabled={processing}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
            >
                {processing ? 'Guardando...' : isEditing ? 'Actualizar credencial' : 'Crear credencial'}
            </button>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isEditing ? `Editar credencial: ${credential?.title}` : 'Nueva credencial docente'}
            description="Registra grados, certificaciones, premios o publicaciones del instructor."
            size="xl"
            footer={footer}
        >
            <form id="credential-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {canManageAll ? (
                        <FormComboboxMulti
                            label="Instructor"
                            id="credential-instructor-combobox"
                            options={instructorOptions.map((i) => ({ value: i.id, label: i.label }))}
                            value={data.instructor_id ? [data.instructor_id] : []}
                            onValueChange={(vals) => setData('instructor_id', vals[0] ?? '')}
                            closeOnSelect
                            triggerPlaceholder="Selecciona instructor"
                            searchPlaceholder="Buscar instructor..."
                            emptyText="Ningún instructor coincide."
                            error={errors.instructor_id}
                        />
                    ) : (
                        <FormInput
                            label="Tu perfil docente"
                            value={instructorOptions[0]?.label ?? 'Mi perfil'}
                            disabled
                        />
                    )}
                    <FormSelect
                        label="Tipo de credencial"
                        required
                        value={data.credential_type}
                        onValueChange={(v) => setData('credential_type', v)}
                        options={credentialTypeOptions}
                        error={errors.credential_type}
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <FormInput
                            label="Nombre de la credencial"
                            required
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Ej. Magister en Educación, PMP, paper publicado…"
                            error={errors.title}
                        />
                        <p className="text-[11px] leading-snug text-slate-500">
                            Es el nombre de este grado, certificado o publicación. No confundir con el título profesional
                            del perfil del instructor.
                        </p>
                    </div>
                    <FormInput
                        label="Institución"
                        required
                        value={data.institution}
                        onChange={(e) => setData('institution', e.target.value)}
                        placeholder="Universidad o entidad emisora"
                        error={errors.institution}
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormInput
                        label="Fecha de obtención"
                        type="date"
                        value={data.obtained_date}
                        onChange={(e) => setData('obtained_date', e.target.value)}
                        error={errors.obtained_date}
                    />
                    <FormInput
                        label="Fecha de vencimiento"
                        type="date"
                        value={data.expiry_date}
                        onChange={(e) => setData('expiry_date', e.target.value)}
                        error={errors.expiry_date}
                    />
                </div>

                <FormInput
                    label="URL de verificación"
                    value={data.credential_url}
                    onChange={(e) => setData('credential_url', e.target.value)}
                    placeholder="https://..."
                    error={errors.credential_url}
                />

                {existingDocHref ? (
                    <p className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <span>Documento actual:</span>
                        <a
                            href={existingDocHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-blue-600 underline-offset-2 hover:underline"
                        >
                            Ver o descargar
                            <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
                        </a>
                        <span className="text-xs text-slate-500">(sube otro archivo abajo para reemplazarlo)</span>
                    </p>
                ) : null}

                <div className="border-t border-slate-200/90 pt-3">
                    <FormInput
                        label="Subir documento (PDF o Word)"
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => setData('document_file', e.target.files?.[0] ?? null)}
                        hint="Máximo 10 MB. Formatos permitidos: PDF, DOC, DOCX. El archivo se guarda en el servidor; no hace falta escribir ninguna ruta."
                        error={errors.document_file}
                    />
                </div>

                {canVerify ? (
                    <FormSwitch
                        label="Credencial verificada"
                        checked={data.is_verified}
                        onCheckedChange={(v) => setData('is_verified', v)}
                        description={
                            data.is_verified
                                ? 'Quedará registrada como verificada. El instructor ya no podrá editarla ni eliminarla.'
                                : 'Pendiente de verificación; el instructor puede actualizarla mientras tanto.'
                        }
                    />
                ) : null}
            </form>
        </Modal>
    );
}
