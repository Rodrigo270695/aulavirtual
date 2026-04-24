/**
 * CourseFormModal — alta/edición de curso (catálogo admin).
 */

import { useForm } from '@inertiajs/react';
import { Link2, Upload } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import {
    FormComboboxMulti,
    FormImageField,
    FormInput,
    FormSelect,
    FormSwitch,
    FormTagInput,
    FormTextarea,
    FormVideoField,
} from '@/components/form';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import coursesRoute from '@/routes/admin/courses';
import type {
    AdminCourse,
    CourseCatalogOption,
    CourseValueLabelOption,
} from '@/types';

interface Props {
    open: boolean;
    onClose: () => void;
    course: AdminCourse | null;
    categoryOptions: CourseCatalogOption[];
    instructorOptions: CourseCatalogOption[];
    levelOptions: CourseValueLabelOption[];
    statusOptions: CourseValueLabelOption[];
    currencyOptions: CourseValueLabelOption[];
    /** Misma regla que categorías: crear o editar curso permite gestionar etiquetas. */
    canAddTags: boolean;
}

type PromoVideoInputMode = 'link' | 'upload';

interface FormData {
    instructor_id: string;
    category_id: string;
    title: string;
    slug: string;
    subtitle: string;
    description: string;
    language: string;
    level: string;
    status: string;
    cover_image_file: File | null;
    remove_cover: boolean;
    promo_video_input: PromoVideoInputMode;
    promo_video_url: string;
    promo_video_file: File | null;
    remove_promo_video: boolean;
    price: string;
    is_free: boolean;
    currency: string;
    certificate_enabled: boolean;
    tags: string[];
}

function toComboboxOptions(rows: CourseCatalogOption[]): { value: string; label: string }[] {
    return rows.map((r) => ({ value: r.id, label: r.label }));
}

export function CourseFormModal({
    open,
    onClose,
    course,
    categoryOptions,
    instructorOptions,
    levelOptions,
    statusOptions,
    currencyOptions,
    canAddTags,
}: Props) {
    const isEditing = course !== null;

    const instructorSelectOptions = useMemo(() => {
        const base = toComboboxOptions(instructorOptions);

        if (course) {
            const exists = base.some((o) => o.value === course.instructor_id);

            if (!exists) {
                const u = course.instructor.user;

                return [
                    {
                        value: course.instructor_id,
                        label: `${u.first_name} ${u.last_name} (${u.email})`,
                    },
                    ...base,
                ];
            }
        }

        return base;
    }, [course, instructorOptions]);

    const categorySelectOptions = useMemo(() => {
        const base = toComboboxOptions(categoryOptions);

        if (course) {
            const exists = base.some((o) => o.value === course.category_id);

            if (!exists) {
                return [
                    {
                        value: course.category_id,
                        label: `${course.category.name} (${course.category.slug})`,
                    },
                    ...base,
                ];
            }
        }

        return base;
    }, [course, categoryOptions]);

    const { data, setData, post, transform, processing, errors, reset, clearErrors } = useForm<FormData>({
        instructor_id: '',
        category_id: '',
        title: '',
        slug: '',
        subtitle: '',
        description: '',
        language: 'es',
        level: 'beginner',
        status: 'draft',
        cover_image_file: null,
        remove_cover: false,
        promo_video_input: 'link',
        promo_video_url: '',
        promo_video_file: null,
        remove_promo_video: false,
        price: '0',
        is_free: false,
        currency: 'USD',
        certificate_enabled: true,
        tags: [],
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        if (course) {
            setData({
                instructor_id: course.instructor_id,
                category_id: course.category_id,
                title: course.title,
                slug: course.slug,
                subtitle: course.subtitle ?? '',
                description: course.description,
                language: course.language || 'es',
                level: course.level,
                status: course.status,
                cover_image_file: null,
                remove_cover: false,
                promo_video_input: course.promo_video_path ? 'upload' : 'link',
                promo_video_url: course.promo_video_url ?? '',
                promo_video_file: null,
                remove_promo_video: false,
                price: String(course.price ?? '0'),
                is_free: course.is_free,
                currency: (course.currency || 'USD').toUpperCase(),
                certificate_enabled: course.certificate_enabled,
                tags: course.tags?.map((t) => t.name) ?? [],
            });
        } else {
            setData({
                instructor_id: '',
                category_id: '',
                title: '',
                slug: '',
                subtitle: '',
                description: '',
                language: 'es',
                level: 'beginner',
                status: 'draft',
                cover_image_file: null,
                remove_cover: false,
                promo_video_input: 'link',
                promo_video_url: '',
                promo_video_file: null,
                remove_promo_video: false,
                price: '0',
                is_free: false,
                currency: 'USD',
                certificate_enabled: true,
                tags: [],
            });
        }

        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sincronizar al abrir modal
    }, [open, course]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: handleClose };

        if (isEditing && course) {
            transform((form) => ({ ...form, _method: 'put' as const }));
            post(coursesRoute.update.url({ course: course.id }), options);
        } else {
            transform((form) => form);
            post(coursesRoute.store.url(), options);
        }
    };

    const existingVideoSrc =
        course?.promo_video_path && !data.remove_promo_video && !data.promo_video_file
            ? `/storage/${course.promo_video_path}`
            : null;
    const existingCoverSrc =
        course?.cover_image && !data.remove_cover && !data.cover_image_file
            ? `/storage/${course.cover_image}`
            : null;

    const promoErrorMsg =
        typeof errors.promo_video_file === 'string'
            ? errors.promo_video_file
            : typeof errors.promo_video_url === 'string'
              ? errors.promo_video_url
              : typeof errors.promo_video_input === 'string'
                ? errors.promo_video_input
                : undefined;
    const coverErrorMsg =
        typeof errors.cover_image_file === 'string'
            ? errors.cover_image_file
            : typeof errors.remove_cover === 'string'
              ? errors.remove_cover
              : undefined;

    const tagsError =
        typeof errors.tags === 'string'
            ? errors.tags
            : Object.entries(errors).find(([k]) => k.startsWith('tags.'))?.[1];

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
                form="course-form"
                type="submit"
                disabled={processing}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
            >
                {processing ? 'Guardando...' : isEditing ? 'Actualizar curso' : 'Crear curso'}
            </button>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isEditing ? `Editar: ${course?.title}` : 'Nuevo curso'}
            description="Datos principales del curso en catálogo. Slug y visibilidad controlan la URL y el estado de publicación."
            size="xl"
            footer={footer}
        >
            <form id="course-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormComboboxMulti
                        label="Instructor"
                        id="course-instructor-combobox"
                        options={instructorSelectOptions}
                        value={data.instructor_id ? [data.instructor_id] : []}
                        onValueChange={(vals) => setData('instructor_id', vals[0] ?? '')}
                        closeOnSelect
                        triggerPlaceholder="Selecciona un instructor"
                        searchPlaceholder="Buscar instructor..."
                        emptyText="Ningún instructor coincide."
                        required
                        error={errors.instructor_id}
                    />
                    <FormComboboxMulti
                        label="Categoría"
                        id="course-category-combobox"
                        options={categorySelectOptions}
                        value={data.category_id ? [data.category_id] : []}
                        onValueChange={(vals) => setData('category_id', vals[0] ?? '')}
                        closeOnSelect
                        triggerPlaceholder="Selecciona una categoría"
                        searchPlaceholder="Buscar categoría..."
                        emptyText="Ninguna categoría coincide."
                        required
                        error={errors.category_id}
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormInput
                        label="Título"
                        required
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        placeholder="Nombre del curso"
                        error={errors.title}
                    />
                    <FormInput
                        label="Slug (URL)"
                        required
                        value={data.slug}
                        onChange={(e) => setData('slug', e.target.value)}
                        placeholder="mi-curso-ejemplo"
                        error={errors.slug}
                    />
                </div>

                <FormInput
                    label="Subtítulo"
                    value={data.subtitle}
                    onChange={(e) => setData('subtitle', e.target.value)}
                    placeholder="Línea corta que resume el curso"
                    error={errors.subtitle}
                />

                <FormTextarea
                    label="Descripción"
                    required
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Descripción completa del curso..."
                    error={errors.description}
                />

                <FormImageField
                    label="Imagen de portada"
                    id="course-cover-image-file"
                    file={data.cover_image_file}
                    existingSrc={existingCoverSrc}
                    onFileChange={(f) => {
                        setData('cover_image_file', f);

                        if (f) {
                            setData('remove_cover', false);
                        }
                    }}
                    onClearStored={() => setData('remove_cover', true)}
                    hint="JPG, PNG, WebP o GIF. Máx. 5 MB."
                    error={coverErrorMsg}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <FormInput
                        label="Idioma (código)"
                        value={data.language}
                        onChange={(e) => setData('language', e.target.value)}
                        placeholder="es"
                        error={errors.language}
                    />
                    <FormSelect
                        label="Nivel"
                        required
                        value={data.level}
                        onValueChange={(v) => setData('level', v)}
                        options={levelOptions}
                        error={errors.level}
                    />
                    <FormSelect
                        label="Estado"
                        required
                        value={data.status}
                        onValueChange={(v) => setData('status', v)}
                        options={statusOptions}
                        error={errors.status}
                    />
                    <FormSelect
                        label="Moneda"
                        value={data.currency}
                        onValueChange={(v) => setData('currency', v)}
                        options={currencyOptions}
                        error={errors.currency}
                    />
                </div>

                <div className="border-t border-slate-200/90 pt-3">
                    <FormTagInput
                        label="Etiquetas"
                        id="course-tags-input"
                        value={data.tags}
                        onChange={(tags) => setData('tags', tags)}
                        disabled={!canAddTags}
                        placeholder="Escribe y Enter o Tab"
                        hint="Mismas etiquetas globales que en categorías; se crean al guardar si no existen."
                        error={typeof tagsError === 'string' ? tagsError : undefined}
                    />
                </div>

                <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Vídeo promocional
                    </span>
                    <p className="text-[11px] leading-relaxed text-slate-500">
                        Enlace a YouTube, Vimeo u otra plataforma, o sube un archivo (máx. 100&nbsp;MB; MP4, WebM, MOV,
                        AVI, 3GP). Solo se usa una opción a la vez.
                    </p>

                    <div
                        className="flex rounded-lg border border-slate-200/90 bg-white p-0.5 shadow-sm"
                        role="group"
                        aria-label="Tipo de vídeo promocional"
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setData('promo_video_input', 'link');
                                setData('promo_video_file', null);
                                setData('remove_promo_video', false);
                            }}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-all sm:text-sm',
                                data.promo_video_input === 'link'
                                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/80'
                                    : 'text-slate-500 hover:text-slate-700',
                            )}
                        >
                            <Link2 className="size-3.5 shrink-0" aria-hidden />
                            Enlace externo
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setData('promo_video_input', 'upload');
                                setData('promo_video_url', '');
                            }}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-all sm:text-sm',
                                data.promo_video_input === 'upload'
                                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/80'
                                    : 'text-slate-500 hover:text-slate-700',
                            )}
                        >
                            <Upload className="size-3.5 shrink-0" aria-hidden />
                            Archivo local
                        </button>
                    </div>

                    {data.promo_video_input === 'link' ? (
                        <FormInput
                            label="URL del vídeo"
                            value={data.promo_video_url}
                            onChange={(e) => setData('promo_video_url', e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=… o https://vimeo.com/…"
                            error={promoErrorMsg ?? errors.promo_video_url}
                        />
                    ) : (
                        <FormVideoField
                            label="Archivo de vídeo"
                            id="course-promo-video-file"
                            file={data.promo_video_file}
                            onFileChange={(f) => {
                                setData('promo_video_file', f);

                                if (f) {
                                    setData('remove_promo_video', false);
                                }
                            }}
                            existingSrc={existingVideoSrc}
                            onClearStored={() => setData('remove_promo_video', true)}
                            hint="Al guardar, el archivo queda en el servidor (storage público)."
                            error={promoErrorMsg ?? errors.promo_video_file}
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
                    <FormInput
                        label="Precio"
                        type="number"
                        min={0}
                        step="0.01"
                        value={data.price}
                        disabled={data.is_free}
                        onChange={(e) => setData('price', e.target.value)}
                        error={errors.price}
                    />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:pb-1">
                        <FormSwitch
                            id="course-is-free"
                            label="Curso gratuito"
                            checked={data.is_free}
                            onCheckedChange={(v) => {
                                setData('is_free', v);

                                if (v) {
                                    setData('price', '0');
                                }
                            }}
                            error={errors.is_free}
                        />
                        <FormSwitch
                            id="course-cert"
                            label="Certificado al completar"
                            checked={data.certificate_enabled}
                            onCheckedChange={(v) => setData('certificate_enabled', v)}
                            error={errors.certificate_enabled}
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
}
