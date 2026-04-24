import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { FormComboboxMulti, FormInput, FormSelect, FormTextarea } from '@/components/form';
import { Modal } from '@/components/ui/modal';
import * as instructorsRoute from '@/routes/admin/instructors';
import type { AdminInstructor, InstructorStatusOption, InstructorUserOption } from '@/types';

interface Props {
    open: boolean;
    onClose: () => void;
    instructor: AdminInstructor | null;
    userOptions: InstructorUserOption[];
    statusOptions: InstructorStatusOption[];
}

interface FormData {
    user_id: string;
    professional_title: string;
    specialization_area: string;
    teaching_bio: string;
    intro_video_url: string;
    status: string;
    approval_notes: string;
    revenue_share_pct: string;
    payout_method: string;
    payout_details_enc: string;
}

const PAYOUT_METHOD_NONE = '__none__';
const PROFESSIONAL_TITLE_OTHER = '__other__';

const PROFESSIONAL_TITLE_OPTIONS = [
    { value: 'Ingeniero Civil', label: 'Ingeniero Civil' },
    { value: 'Ingeniero de Sistemas', label: 'Ingeniero de Sistemas' },
    { value: 'Ingeniero Industrial', label: 'Ingeniero Industrial' },
    { value: 'Ingeniero Mecánico', label: 'Ingeniero Mecánico' },
    { value: 'Ingeniero Eléctrico', label: 'Ingeniero Eléctrico' },
    { value: 'Ingeniero Electrónico', label: 'Ingeniero Electrónico' },
    { value: 'Ingeniero Ambiental', label: 'Ingeniero Ambiental' },
    { value: 'Arquitecto', label: 'Arquitecto' },
    { value: 'Magíster en Ingeniería', label: 'Magíster en Ingeniería' },
    { value: 'Doctor en Ingeniería', label: 'Doctor en Ingeniería' },
    { value: PROFESSIONAL_TITLE_OTHER, label: 'Otro (especificar)' },
];

const PAYOUT_OPTIONS = [
    { value: PAYOUT_METHOD_NONE, label: 'Sin especificar' },
    { value: 'bank_transfer', label: 'Transferencia bancaria' },
    { value: 'yape', label: 'Yape' },
    { value: 'plim', label: 'Plim' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'stripe_connect', label: 'Stripe Connect' },
];

export function InstructorFormModal({ open, onClose, instructor, userOptions, statusOptions }: Props) {
    const isEditing = instructor !== null;
    const [selectedProfessionalTitle, setSelectedProfessionalTitle] = useState<string>('');

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        user_id: '',
        professional_title: '',
        specialization_area: '',
        teaching_bio: '',
        intro_video_url: '',
        status: 'pending',
        approval_notes: '',
        revenue_share_pct: '70.00',
        payout_method: PAYOUT_METHOD_NONE,
        payout_details_enc: '',
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        if (instructor) {
            const existsInList = PROFESSIONAL_TITLE_OPTIONS.some(
                (opt) => opt.value === instructor.professional_title,
            );

            setData({
                user_id: instructor.user_id,
                professional_title: instructor.professional_title,
                specialization_area: instructor.specialization_area ?? '',
                teaching_bio: instructor.teaching_bio ?? '',
                intro_video_url: instructor.intro_video_url ?? '',
                status: instructor.status,
                approval_notes: instructor.approval_notes ?? '',
                revenue_share_pct: String(instructor.revenue_share_pct ?? '70.00'),
                payout_method: instructor.payout_method ?? PAYOUT_METHOD_NONE,
                payout_details_enc: instructor.payout_details_enc ?? '',
            });
            setSelectedProfessionalTitle(existsInList ? instructor.professional_title : PROFESSIONAL_TITLE_OTHER);
        } else {
            setData({
                user_id: '',
                professional_title: '',
                specialization_area: '',
                teaching_bio: '',
                intro_video_url: '',
                status: 'pending',
                approval_notes: '',
                revenue_share_pct: '70.00',
                payout_method: PAYOUT_METHOD_NONE,
                payout_details_enc: '',
            });
            setSelectedProfessionalTitle('');
        }

        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sincronizar al abrir modal
    }, [open, instructor]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: handleClose };

        if (isEditing && instructor) {
            put(instructorsRoute.update.url({ instructor: instructor.id }), options);
        } else {
            post(instructorsRoute.store.url(), options);
        }
    };

    const userSelectOptions = [
        ...(instructor
            ? [{
                value: instructor.user_id,
                label: `${instructor.user.first_name} ${instructor.user.last_name} (${instructor.user.email})`,
            }]
            : []),
        ...userOptions.map((u) => ({ value: u.id, label: u.label })),
    ].filter((v, i, arr) => arr.findIndex((x) => x.value === v.value) === i);

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
                form="instructor-form"
                type="submit"
                disabled={processing}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
            >
                {processing ? 'Guardando...' : isEditing ? 'Actualizar instructor' : 'Crear instructor'}
            </button>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isEditing ? `Editar instructor: ${instructor?.professional_title}` : 'Nuevo instructor'}
            description="Gestiona el perfil docente, su estado de aprobación y configuración de pagos."
            size="xl"
            footer={footer}
        >
            <form id="instructor-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormComboboxMulti
                    label="Usuario base"
                    id="instructor-user-combobox"
                    options={userSelectOptions}
                    value={data.user_id ? [data.user_id] : []}
                    onValueChange={(vals) => setData('user_id', vals[0] ?? '')}
                    closeOnSelect
                    triggerPlaceholder="Selecciona un usuario"
                    searchPlaceholder="Buscar usuario..."
                    emptyText="Ningún usuario coincide."
                    error={errors.user_id}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-3">
                        <FormSelect
                            label="Título profesional"
                            required
                            value={selectedProfessionalTitle}
                            onValueChange={(v) => {
                                setSelectedProfessionalTitle(v);

                                if (v !== PROFESSIONAL_TITLE_OTHER) {
                                    setData('professional_title', v);
                                } else if (
                                    PROFESSIONAL_TITLE_OPTIONS.some((opt) => opt.value === data.professional_title)
                                ) {
                                    setData('professional_title', '');
                                }
                            }}
                            options={PROFESSIONAL_TITLE_OPTIONS}
                            placeholder="Selecciona una carrera/título"
                            error={errors.professional_title}
                        />
                        {selectedProfessionalTitle === PROFESSIONAL_TITLE_OTHER && (
                            <FormInput
                                label="Especifica el título"
                                required
                                value={data.professional_title}
                                onChange={(e) => setData('professional_title', e.target.value)}
                                placeholder="Ej. Lic. en Matemática, PhD..."
                                error={errors.professional_title}
                            />
                        )}
                    </div>
                    <FormInput
                        label="Área de especialización"
                        value={data.specialization_area}
                        onChange={(e) => setData('specialization_area', e.target.value)}
                        placeholder="Estructuras, Geotecnia, Software..."
                        error={errors.specialization_area}
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <FormSelect
                        label="Estado"
                        value={data.status}
                        onValueChange={(v) => setData('status', v)}
                        options={statusOptions}
                        error={errors.status}
                    />
                    <FormInput
                        label="Revenue share %"
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={data.revenue_share_pct}
                        onChange={(e) => setData('revenue_share_pct', e.target.value)}
                        error={errors.revenue_share_pct}
                    />
                    <FormSelect
                        label="Método de pago"
                        value={data.payout_method || PAYOUT_METHOD_NONE}
                        onValueChange={(v) =>
                            setData('payout_method', v === PAYOUT_METHOD_NONE ? '' : v)
                        }
                        options={PAYOUT_OPTIONS}
                        placeholder="Sin especificar"
                        error={errors.payout_method}
                    />
                </div>

                <div className="flex flex-col gap-4 border-t border-slate-200/90 pt-3">
                    <FormInput
                        label="Video de presentación (URL)"
                        value={data.intro_video_url}
                        onChange={(e) => setData('intro_video_url', e.target.value)}
                        placeholder="https://..."
                        error={errors.intro_video_url}
                    />

                    <FormTextarea
                        label="Bio docente"
                        value={data.teaching_bio}
                        onChange={(e) => setData('teaching_bio', e.target.value)}
                        placeholder="Describe experiencia y enfoque pedagógico..."
                        error={errors.teaching_bio}
                    />

                    <FormTextarea
                        label="Notas de aprobación (admin)"
                        value={data.approval_notes}
                        onChange={(e) => setData('approval_notes', e.target.value)}
                        placeholder="Notas internas para revisión del instructor..."
                        error={errors.approval_notes}
                    />

                    <FormTextarea
                        label="Detalles de pago (cifrados en app)"
                        value={data.payout_details_enc}
                        onChange={(e) => setData('payout_details_enc', e.target.value)}
                        placeholder="Cuenta bancaria, alias, etc."
                        error={errors.payout_details_enc}
                    />
                </div>
            </form>
        </Modal>
    );
}
