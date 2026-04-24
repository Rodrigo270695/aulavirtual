/**
 * CategoryFormModal — categoría + etiquetas; portada como archivo en storage público.
 */

import { useForm } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import {
    FormComboboxMulti,
    FormComboboxSingle,
    FormImageField,
    FormInput,
    FormSwitch,
    FormTagInput,
    FormTextarea,
} from '@/components/form';
import { Modal } from '@/components/ui/modal';
import { getCategoryIconComboboxOptions, isCategoryIconKey } from '@/lib/category-icons';
import * as categoriesRoute from '@/routes/admin/categories';
import type { AdminCategory, CategoryParentOption } from '@/types';

interface Props {
    open: boolean;
    onClose: () => void;
    category: AdminCategory | null;
    parentOptions: CategoryParentOption[];
    canAddTags: boolean;
}

interface FormData {
    parent_id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    is_active: boolean;
    tags: string[];
    cover_image_file: File | null;
    remove_cover: boolean;
}

export function CategoryFormModal({ open, onClose, category, parentOptions, canAddTags }: Props) {
    const isEditing = category !== null;

    const parentChoices = useMemo(() => {
        if (!category) {
            return parentOptions;
        }

        return parentOptions.filter((o) => o.id !== category.id);
    }, [parentOptions, category]);

    const { data, setData, post, transform, processing, errors, reset, clearErrors } = useForm<FormData>({
        parent_id: '',
        name: '',
        slug: '',
        description: '',
        icon: '',
        is_active: true,
        tags: [],
        cover_image_file: null,
        remove_cover: false,
    });

    const baseCategoryIconOptions = useMemo(() => getCategoryIconComboboxOptions(), []);

    const categoryIconOptions = useMemo(() => {
        const v = data.icon ?? '';

        if (v !== '' && !isCategoryIconKey(v)) {
            return [
                {
                    value: v,
                    label: `Valor guardado no listado — elige otro ícono`,
                    icon: <AlertCircle className="size-4 shrink-0 text-amber-600" aria-hidden />,
                },
                ...baseCategoryIconOptions,
            ];
        }

        return baseCategoryIconOptions;
    }, [data.icon, baseCategoryIconOptions]);

    useEffect(() => {
        if (!open) {
            return;
        }

        if (category) {
            setData({
                parent_id: category.parent_id ?? '',
                name: category.name,
                slug: category.slug,
                description: category.description ?? '',
                icon: category.icon ?? '',
                is_active: category.is_active,
                tags: category.tags?.map((t) => t.name) ?? [],
                cover_image_file: null,
                remove_cover: false,
            });
        } else {
            setData({
                parent_id: '',
                name: '',
                slug: '',
                description: '',
                icon: '',
                is_active: true,
                tags: [],
                cover_image_file: null,
                remove_cover: false,
            });
        }

        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sincronizar al abrir
    }, [open, category]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = { onSuccess: handleClose, preserveScroll: true };
        const editing = isEditing && category !== null;

        if (editing) {
            transform((form) => ({ ...form, _method: 'put' as const }));
            post(categoriesRoute.update.url({ category: category.id }), options);
        } else {
            transform((form) => form);
            post(categoriesRoute.store.url(), options);
        }
    };

    const tagsError =
        typeof errors.tags === 'string'
            ? errors.tags
            : Object.entries(errors).find(([k]) => k.startsWith('tags.'))?.[1];

    const coverError = errors.cover_image_file ?? errors.remove_cover;

    const existingCoverSrc =
        category?.cover_image && !data.remove_cover ? `/storage/${category.cover_image}` : null;

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
                form="category-form"
                type="submit"
                disabled={processing}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
            >
                {processing ? 'Guardando...' : isEditing ? 'Actualizar categoría' : 'Crear categoría'}
            </button>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isEditing ? `Editar categoría: ${category?.name}` : 'Nueva categoría'}
            description="Padre opcional. Slug en URLs."
            size="xl"
            footer={footer}
        >
            <form id="category-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormComboboxMulti
                    label="Categoría padre"
                    id="category-parent-combobox"
                    options={parentChoices.map((p) => ({ value: p.id, label: p.label }))}
                    value={data.parent_id ? [data.parent_id] : []}
                    onValueChange={(vals) => setData('parent_id', vals[0] ?? '')}
                    closeOnSelect
                    triggerPlaceholder="Raíz (sin padre)"
                    searchPlaceholder="Buscar categoría..."
                    emptyText="Ninguna categoría coincide."
                    error={errors.parent_id}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormInput
                        label="Nombre"
                        required
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Ej. Ingeniería civil"
                        error={errors.name}
                    />
                    <FormInput
                        label="Slug"
                        value={data.slug}
                        onChange={(e) => setData('slug', e.target.value)}
                        placeholder="Vacío = se genera al guardar"
                        error={errors.slug}
                    />
                </div>

                <FormTextarea
                    label="Descripción"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={3}
                    error={errors.description}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-start">
                    <FormComboboxSingle
                        label="Ícono"
                        id="category-icon-combobox"
                        options={categoryIconOptions}
                        value={data.icon ?? ''}
                        onValueChange={(v) => setData('icon', v)}
                        triggerPlaceholder="Sin ícono"
                        searchPlaceholder="Buscar ícono…"
                        emptyText="Ningún ícono coincide."
                        hint="Solo íconos Lucide permitidos; se guarda la clave (p. ej. graduation-cap)."
                        error={errors.icon}
                    />
                    <FormImageField
                        label="Portada"
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
                        error={typeof coverError === 'string' ? coverError : undefined}
                    />
                </div>

                <div className="border-t border-slate-200/90 pt-3">
                    <FormTagInput
                        label="Etiquetas"
                        value={data.tags}
                        onChange={(tags) => setData('tags', tags)}
                        disabled={!canAddTags}
                        placeholder="Escribe y Enter o Tab"
                        error={typeof tagsError === 'string' ? tagsError : undefined}
                    />
                </div>

                <FormSwitch
                    label="Activa"
                    checked={data.is_active}
                    onCheckedChange={(v) => setData('is_active', v)}
                    description={data.is_active ? 'Visible en catálogo.' : 'Oculta.'}
                />
            </form>
        </Modal>
    );
}
