/**
 * Formulario modal de paquete (combo de cursos con precio promocional).
 */

import { useForm } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FormComboboxSingle, FormInput, FormSwitch, FormTextarea } from '@/components/form';
import { Modal } from '@/components/ui/modal';
import * as packagesRoute from '@/routes/admin/packages';
import type { AdminPackage, PackageCourseOption } from '@/types';

interface CourseRow {
    course_id: string;
}

interface FormData {
    title: string;
    slug: string;
    description: string;
    cover_image: string;
    package_price: string;
    is_active: boolean;
    valid_from: string;
    valid_until: string;
    courses: CourseRow[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    pkg: AdminPackage | null;
    courseOptions: PackageCourseOption[];
}

function toCombo(opts: PackageCourseOption[]): { value: string; label: string }[] {
    return opts.map((o) => ({ value: o.id, label: o.label }));
}

export function PackageFormModal({ open, onClose, pkg, courseOptions }: Props) {
    const isEditing = pkg !== null;
    const [pickerCourse, setPickerCourse] = useState('');

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        title: '',
        slug: '',
        description: '',
        cover_image: '',
        package_price: '0',
        is_active: true,
        valid_from: '',
        valid_until: '',
        courses: [],
    });

    const priceById = useMemo(() => {
        const m = new Map<string, number>();
        courseOptions.forEach((o) => {
            const n = typeof o.price === 'string' ? parseFloat(o.price) : o.price;
            m.set(o.id, Number.isNaN(n) ? 0 : n);
        });
        if (pkg?.courses) {
            pkg.courses.forEach((c) => {
                if (!m.has(c.id)) m.set(c.id, 0);
            });
        }
        return m;
    }, [courseOptions, pkg]);

    const sumReference = useMemo(() => {
        return data.courses.reduce((acc, row) => acc + (priceById.get(row.course_id) ?? 0), 0);
    }, [data.courses, priceById]);

    const courseLabelById = useMemo(() => {
        const m = new Map<string, string>();
        courseOptions.forEach((o) => m.set(o.id, o.label));
        if (pkg?.courses) {
            pkg.courses.forEach((c) => {
                m.set(c.id, `${c.title} (${c.slug})`);
            });
        }
        return m;
    }, [courseOptions, pkg]);

    const pickerOptions = useMemo(() => {
        const taken = new Set(data.courses.map((r) => r.course_id));
        return toCombo(courseOptions).filter((o) => !taken.has(o.value));
    }, [courseOptions, data.courses]);

    useEffect(() => {
        if (open) {
            if (pkg) {
                setData({
                    title: pkg.title,
                    slug: pkg.slug,
                    description: pkg.description ?? '',
                    cover_image: pkg.cover_image ?? '',
                    package_price: String(pkg.package_price),
                    is_active: pkg.is_active,
                    valid_from: pkg.valid_from ? pkg.valid_from.slice(0, 10) : '',
                    valid_until: pkg.valid_until ? pkg.valid_until.slice(0, 10) : '',
                    courses: [...pkg.courses]
                        .sort((a, b) => a.pivot.sort_order - b.pivot.sort_order)
                        .map((c) => ({ course_id: c.id })),
                });
            } else {
                setData({
                    title: '',
                    slug: '',
                    description: '',
                    cover_image: '',
                    package_price: '0',
                    is_active: true,
                    valid_from: '',
                    valid_until: '',
                    courses: [],
                });
            }
            setPickerCourse('');
            clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, pkg]);

    const handleClose = () => {
        reset();
        clearErrors();
        setPickerCourse('');
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const opts = { onSuccess: handleClose, preserveScroll: true };
        if (isEditing && pkg) {
            put(packagesRoute.update.url({ package: pkg.id }), opts);
        } else {
            post(packagesRoute.store.url(), opts);
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
        setData('courses', [...data.courses, { course_id: courseId }]);
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
                form="package-form"
                type="submit"
                disabled={processing}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
            >
                {processing ? 'Guardando…' : isEditing ? 'Actualizar paquete' : 'Crear paquete'}
            </button>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isEditing ? 'Editar paquete' : 'Nuevo paquete'}
            description="Varios cursos a un precio conjunto. La suma de precios de referencia y el % de ahorro se recalculan al guardar según los cursos elegidos."
            size="2xl"
            footer={footer}
        >
            <form id="package-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    error={errors.description}
                    rows={3}
                />

                <FormInput
                    label="Imagen de portada (URL o ruta)"
                    value={data.cover_image}
                    onChange={(e) => setData('cover_image', e.target.value)}
                    error={errors.cover_image}
                    maxLength={500}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                        label="Precio del paquete"
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.package_price}
                        onChange={(e) => setData('package_price', e.target.value)}
                        error={errors.package_price}
                    />
                    <div className="flex flex-col justify-end rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm">
                        <span className="text-xs font-medium text-slate-500">Suma precios individuales (referencia)</span>
                        <span className="text-lg font-bold tabular-nums text-slate-800">
                            {sumReference.toLocaleString('es-PE', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </span>
                        <span className="text-[10px] text-slate-400">Vista previa; al guardar se persiste en el servidor.</span>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                        label="Válido desde"
                        type="date"
                        value={data.valid_from}
                        onChange={(e) => setData('valid_from', e.target.value)}
                        error={errors.valid_from}
                    />
                    <FormInput
                        label="Válido hasta"
                        type="date"
                        value={data.valid_until}
                        onChange={(e) => setData('valid_until', e.target.value)}
                        error={errors.valid_until}
                    />
                </div>

                <FormSwitch
                    label="Activo en catálogo"
                    checked={data.is_active}
                    onCheckedChange={(v) => setData('is_active', v)}
                />

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <div className="mb-2 flex flex-col gap-1">
                        <span className="text-sm font-semibold text-slate-800">Cursos incluidos</span>
                        <span className="text-xs text-slate-500">
                            Orden de la lista = orden de presentación en el paquete.
                        </span>
                    </div>

                    {coursesError && <p className="mb-2 text-sm text-red-600">{coursesError}</p>}

                    {data.courses.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-sm text-slate-400">
                            Añade al menos un curso con el selector de abajo.
                        </p>
                    ) : (
                        <ul className="mb-3 flex flex-col gap-2">
                            {data.courses.map((row, index) => (
                                <li
                                    key={`${row.course_id}-${index}`}
                                    className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                                >
                                    <div className="min-w-0 flex-1 text-sm font-medium text-slate-800">
                                        {courseLabelById.get(row.course_id) ?? row.course_id}
                                        <span className="ml-2 text-xs font-normal tabular-nums text-slate-500">
                                            (
                                            {(priceById.get(row.course_id) ?? 0).toLocaleString('es-PE', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                            )
                                        </span>
                                    </div>
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
                        emptyText={
                            pickerOptions.length === 0 ? 'Todos los cursos ya están en el paquete' : 'Sin coincidencias'
                        }
                    />
                </div>
            </form>
        </Modal>
    );
}
