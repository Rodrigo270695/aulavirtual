/**
 * Formulario modal de especialización (alta / edición).
 * Misma línea visual que UserFormModal / CourseFormModal.
 */

import { useForm } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    FormComboboxSingle,
    FormInput,
    FormSelect,
    FormSwitch,
    FormTextarea,
} from '@/components/form';
import { Modal } from '@/components/ui/modal';
import * as specializationsRoute from '@/routes/admin/specializations';
import type {
    AdminSpecialization,
    CourseCatalogOption,
    CourseValueLabelOption,
} from '@/types';

interface CourseRow {
    course_id: string;
    is_required: boolean;
}

interface FormData {
    instructor_id: string;
    category_id: string;
    title: string;
    slug: string;
    description: string;
    cover_image: string;
    promo_video_url: string;
    price: string;
    discount_price: string;
    discount_ends_at: string;
    difficulty_level: string;
    status: string;
    courses: CourseRow[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    specialization: AdminSpecialization | null;
    categoryOptions: CourseCatalogOption[];
    instructorOptions: CourseCatalogOption[];
    courseOptions: CourseCatalogOption[];
    statusOptions: CourseValueLabelOption[];
    difficultyOptions: CourseValueLabelOption[];
}

function toCombo(opts: CourseCatalogOption[]): { value: string; label: string }[] {
    return opts.map((o) => ({ value: o.id, label: o.label }));
}

export function SpecializationFormModal({
    open,
    onClose,
    specialization,
    categoryOptions,
    instructorOptions,
    courseOptions,
    statusOptions,
    difficultyOptions,
}: Props) {
    const isEditing = specialization !== null;
    const [pickerCourse, setPickerCourse] = useState('');

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        instructor_id: '',
        category_id: '',
        title: '',
        slug: '',
        description: '',
        cover_image: '',
        promo_video_url: '',
        price: '0',
        discount_price: '',
        discount_ends_at: '',
        difficulty_level: 'intermediate',
        status: 'draft',
        courses: [],
    });

    const instructorSelectOptions = useMemo(() => {
        const base = toCombo(instructorOptions);
        if (specialization) {
            const exists = base.some((o) => o.value === specialization.instructor_id);
            if (!exists) {
                const u = specialization.instructor.user;
                return [
                    {
                        value: specialization.instructor_id,
                        label: `${u.first_name} ${u.last_name} (${u.email})`,
                    },
                    ...base,
                ];
            }
        }
        return base;
    }, [specialization, instructorOptions]);

    const categorySelectOptions = useMemo(() => {
        const base = toCombo(categoryOptions);
        if (specialization) {
            const exists = base.some((o) => o.value === specialization.category_id);
            if (!exists) {
                const c = specialization.category;
                return [{ value: specialization.category_id, label: `${c.name} (${c.slug})` }, ...base];
            }
        }
        return base;
    }, [specialization, categoryOptions]);

    const courseLabelById = useMemo(() => {
        const m = new Map<string, string>();
        courseOptions.forEach((o) => m.set(o.id, o.label));
        if (specialization?.courses) {
            specialization.courses.forEach((c) => {
                m.set(c.id, `${c.title} (${c.slug})`);
            });
        }
        return m;
    }, [courseOptions, specialization]);

    const pickerOptions = useMemo(() => {
        const taken = new Set(data.courses.map((r) => r.course_id));
        return toCombo(courseOptions).filter((o) => !taken.has(o.value));
    }, [courseOptions, data.courses]);

    useEffect(() => {
        if (open) {
            if (specialization) {
                setData({
                    instructor_id: specialization.instructor_id,
                    category_id: specialization.category_id,
                    title: specialization.title,
                    slug: specialization.slug,
                    description: specialization.description,
                    cover_image: specialization.cover_image ?? '',
                    promo_video_url: specialization.promo_video_url ?? '',
                    price: String(specialization.price),
                    discount_price:
                        specialization.discount_price !== null && specialization.discount_price !== ''
                            ? String(specialization.discount_price)
                            : '',
                    discount_ends_at: specialization.discount_ends_at
                        ? specialization.discount_ends_at.slice(0, 16)
                        : '',
                    difficulty_level: specialization.difficulty_level,
                    status: specialization.status,
                    courses: [...specialization.courses]
                        .sort((a, b) => a.pivot.sort_order - b.pivot.sort_order)
                        .map((c) => ({
                            course_id: c.id,
                            is_required: c.pivot.is_required,
                        })),
                });
            } else {
                setData({
                    instructor_id: '',
                    category_id: '',
                    title: '',
                    slug: '',
                    description: '',
                    cover_image: '',
                    promo_video_url: '',
                    price: '0',
                    discount_price: '',
                    discount_ends_at: '',
                    difficulty_level: 'intermediate',
                    status: 'draft',
                    courses: [],
                });
            }
            setPickerCourse('');
            clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- patrón Inertia / open + specialization
    }, [open, specialization]);

    const handleClose = () => {
        reset();
        clearErrors();
        setPickerCourse('');
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const opts = { onSuccess: handleClose, preserveScroll: true };
        if (isEditing && specialization) {
            put(specializationsRoute.update.url({ specialization: specialization.id }), opts);
        } else {
            post(specializationsRoute.store.url(), opts);
        }
    };

    const moveCourse = (index: number, dir: -1 | 1) => {
        const next = index + dir;
        if (next < 0 || next >= data.courses.length) return;
        const copy = [...data.courses];
        const t = copy[index];
        copy[index] = copy[next]!;
        copy[next] = t!;
        setData('courses', copy);
    };

    const removeCourseAt = (index: number) => {
        setData(
            'courses',
            data.courses.filter((_, i) => i !== index),
        );
    };

    const appendCourse = (courseId: string) => {
        if (!courseId || data.courses.some((r) => r.course_id === courseId)) return;
        setData('courses', [...data.courses, { course_id: courseId, is_required: true }]);
        setPickerCourse('');
    };

    const coursesError =
        (typeof errors.courses === 'string' ? errors.courses : undefined) ??
        Object.entries(errors).find(([k]) => k.startsWith('courses.'))?.[1];

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
                form="specialization-form"
                type="submit"
                disabled={processing}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
            >
                {processing ? 'Guardando…' : isEditing ? 'Actualizar especialización' : 'Crear especialización'}
            </button>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isEditing ? 'Editar especialización' : 'Nueva especialización'}
            description="Ruta de aprendizaje con varios cursos ordenados. El precio y la categoría son propios del programa."
            size="2xl"
            footer={footer}
        >
            <form id="specialization-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormComboboxSingle
                        label="Instructor"
                        required
                        options={instructorSelectOptions}
                        value={data.instructor_id}
                        onValueChange={(v) => setData('instructor_id', v)}
                        error={errors.instructor_id}
                        triggerPlaceholder="Selecciona instructor…"
                    />
                    <FormComboboxSingle
                        label="Categoría"
                        required
                        options={categorySelectOptions}
                        value={data.category_id}
                        onValueChange={(v) => setData('category_id', v)}
                        error={errors.category_id}
                        triggerPlaceholder="Selecciona categoría…"
                    />
                </div>

                <FormInput
                    label="Título"
                    required
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    error={errors.title}
                    maxLength={255}
                />
                <FormInput
                    label="Slug (URL)"
                    required
                    value={data.slug}
                    onChange={(e) => setData('slug', e.target.value)}
                    error={errors.slug}
                    maxLength={300}
                    hint="Solo minúsculas, números y guiones. Si está vacío al crear, el servidor lo genera a partir del título."
                />

                <FormTextarea
                    label="Descripción"
                    required
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    error={errors.description}
                    rows={4}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                        label="Imagen de portada (URL o ruta)"
                        value={data.cover_image}
                        onChange={(e) => setData('cover_image', e.target.value)}
                        error={errors.cover_image}
                        maxLength={500}
                    />
                    <FormInput
                        label="Vídeo promo (URL)"
                        value={data.promo_video_url}
                        onChange={(e) => setData('promo_video_url', e.target.value)}
                        error={errors.promo_video_url}
                        maxLength={500}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                        label="Precio"
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.price}
                        onChange={(e) => setData('price', e.target.value)}
                        error={errors.price}
                    />
                    <FormInput
                        label="Precio con descuento"
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.discount_price}
                        onChange={(e) => setData('discount_price', e.target.value)}
                        error={errors.discount_price}
                    />
                </div>

                <FormInput
                    label="Fin del descuento"
                    type="datetime-local"
                    value={data.discount_ends_at}
                    onChange={(e) => setData('discount_ends_at', e.target.value)}
                    error={errors.discount_ends_at}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormSelect
                        label="Nivel"
                        required
                        value={data.difficulty_level}
                        onValueChange={(v) => setData('difficulty_level', v)}
                        options={difficultyOptions}
                        error={errors.difficulty_level}
                    />
                    <FormSelect
                        label="Estado"
                        required
                        value={data.status}
                        onValueChange={(v) => setData('status', v)}
                        options={statusOptions}
                        error={errors.status}
                    />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <div className="mb-2 flex flex-col gap-1">
                        <span className="text-sm font-semibold text-slate-800">Cursos de la ruta</span>
                        <span className="text-xs text-slate-500">
                            Orden de arriba a abajo = orden de la especialización. Marca si cada curso es obligatorio
                            para el certificado del programa.
                        </span>
                    </div>

                    {coursesError && <p className="mb-2 text-sm text-red-600">{coursesError}</p>}

                    {data.courses.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-sm text-slate-400">
                            Aún no hay cursos. Añade uno con el selector de abajo.
                        </p>
                    ) : (
                        <ul className="mb-3 flex flex-col gap-2">
                            {data.courses.map((row, index) => (
                                <li
                                    key={`${row.course_id}-${index}`}
                                    className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:gap-3"
                                >
                                    <div className="min-w-0 flex-1 text-sm font-medium text-slate-800">
                                        {courseLabelById.get(row.course_id) ?? row.course_id}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <FormSwitch
                                            label="Obligatorio"
                                            checked={row.is_required}
                                            onCheckedChange={(v) =>
                                                setData(
                                                    'courses',
                                                    data.courses.map((r, i) =>
                                                        i === index ? { ...r, is_required: v } : r,
                                                    ),
                                                )
                                            }
                                        />
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                title="Subir"
                                                onClick={() => moveCourse(index, -1)}
                                                disabled={index === 0}
                                                className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                                            >
                                                <ChevronUp className="size-4" />
                                            </button>
                                            <button
                                                type="button"
                                                title="Bajar"
                                                onClick={() => moveCourse(index, 1)}
                                                disabled={index === data.courses.length - 1}
                                                className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                                            >
                                                <ChevronDown className="size-4" />
                                            </button>
                                            <button
                                                type="button"
                                                title="Quitar"
                                                onClick={() => removeCourseAt(index)}
                                                className="flex size-8 items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    <FormComboboxSingle
                        label="Añadir curso"
                        options={pickerOptions}
                        value={pickerCourse}
                        onValueChange={(v) => appendCourse(v)}
                        triggerPlaceholder="Buscar curso para añadir…"
                        emptyText={pickerOptions.length === 0 ? 'Todos los cursos ya están en la lista' : 'Sin coincidencias'}
                    />
                </div>
            </form>
        </Modal>
    );
}
