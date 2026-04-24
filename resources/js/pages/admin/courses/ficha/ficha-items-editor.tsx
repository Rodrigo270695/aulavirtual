/**
 * Editor de lista ordenable para requisitos / objetivos / público (ficha de venta).
 */

import { useForm } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FormTextarea } from '@/components/form';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { cn } from '@/lib/utils';
import type { CourseFichaLineItem } from '@/types';

interface FormRow {
    description: string;
}

interface Props {
    sectionTitle: string;
    helperText: string;
    initialItems: CourseFichaLineItem[];
    updateUrl: string;
    canEdit: boolean;
}

function serializeItems(items: CourseFichaLineItem[]): string {
    return JSON.stringify(items.map((i) => i.description));
}

export function FichaItemsEditor({ sectionTitle, helperText, initialItems, updateUrl, canEdit }: Props) {
    const snapshot = useMemo(() => serializeItems(initialItems), [initialItems]);
    const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);

    const { data, setData, put, processing, errors } = useForm<{ items: FormRow[] }>({
        items: initialItems.map((i) => ({ description: i.description })),
    });

    useEffect(() => {
        setData(
            'items',
            initialItems.map((i) => ({ description: i.description })),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sincronizar al cambiar datos del servidor
    }, [snapshot]);

    const move = (index: number, dir: -1 | 1) => {
        const next = index + dir;

        if (next < 0 || next >= data.items.length) {
            return;
        }

        const copy = [...data.items];
        const tmp = copy[index];
        copy[index] = copy[next]!;
        copy[next] = tmp!;
        setData('items', copy);
    };

    const removeAt = (index: number) => {
        setData(
            'items',
            data.items.filter((_, i) => i !== index),
        );
    };

    const confirmRemove = () => {
        if (pendingDeleteIndex === null) {
            return;
        }

        removeAt(pendingDeleteIndex);
        setPendingDeleteIndex(null);
    };

    const addRow = () => {
        setData('items', [...data.items, { description: '' }]);
    };

    const rowError = (index: number): string | undefined => {
        const k = `items.${index}.description`;
        const v = (errors as Record<string, string | undefined>)[k];

        return typeof v === 'string' ? v : undefined;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!canEdit) {
            return;
        }

        put(updateUrl, { preserveScroll: true });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
                <h2 className="text-sm font-semibold text-slate-800">{sectionTitle}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{helperText}</p>
            </div>

            <div className="flex flex-col gap-3">
                {data.items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-400">
                        No hay ítems. Añade el primero con el botón de abajo.
                    </p>
                ) : (
                    data.items.map((row, index) => (
                        <div
                            key={index}
                            className={cn(
                                'flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-start sm:gap-3',
                                rowError(index) && 'border-red-200 bg-red-50/20',
                            )}
                        >
                            <div className="min-w-0 flex-1">
                                <FormTextarea
                                    label={`Ítem ${index + 1}`}
                                    value={row.description}
                                    onChange={(e) => {
                                        const v = e.target.value.slice(0, 500);
                                        setData(
                                            'items',
                                            data.items.map((it, i) =>
                                                i === index ? { description: v } : it,
                                            ),
                                        );
                                    }}
                                    rows={2}
                                    maxLength={500}
                                    disabled={!canEdit}
                                    placeholder="Texto que verá el estudiante en la página del curso…"
                                    error={rowError(index)}
                                />
                                <p className="mt-1 text-[10px] text-slate-400 tabular-nums">
                                    {row.description.length}/500
                                </p>
                            </div>
                            {canEdit && (
                                <div className="flex shrink-0 flex-row gap-1 sm:flex-col sm:pt-6">
                                    <button
                                        type="button"
                                        title="Subir"
                                        onClick={() => move(index, -1)}
                                        disabled={index === 0}
                                        className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
                                    >
                                        <ChevronUp className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        title="Bajar"
                                        onClick={() => move(index, 1)}
                                        disabled={index === data.items.length - 1}
                                        className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
                                    >
                                        <ChevronDown className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        title="Quitar"
                                        onClick={() => setPendingDeleteIndex(index)}
                                        className="flex size-8 items-center justify-center rounded-lg border border-red-100 text-red-500 transition-colors hover:bg-red-50"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {canEdit && (
                <div className="flex flex-wrap items-center gap-3 border-t border-slate-200/90 pt-4">
                    <button
                        type="button"
                        onClick={addRow}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-700"
                    >
                        <Plus className="size-3.5" />
                        Añadir ítem
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 disabled:pointer-events-none disabled:opacity-55"
                        style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
                    >
                        {processing ? 'Guardando…' : 'Guardar esta sección'}
                    </button>
                </div>
            )}

            {!canEdit && (
                <p className="text-xs text-slate-400">No tienes permiso para editar la ficha de venta.</p>
            )}

            <ConfirmModal
                open={pendingDeleteIndex !== null}
                onClose={() => setPendingDeleteIndex(null)}
                onConfirm={confirmRemove}
                title="¿Quitar este ítem?"
                description={
                    pendingDeleteIndex !== null ? (
                        <>
                            Se eliminará de la lista. Para guardarlo en el servidor, pulsa después «Guardar esta
                            sección».
                            {data.items[pendingDeleteIndex]?.description?.trim() ? (
                                <span className="mt-2 block rounded-md bg-slate-100 px-2 py-1.5 font-normal text-slate-700">
                                    «{data.items[pendingDeleteIndex]!.description.trim().slice(0, 120)}
                                    {data.items[pendingDeleteIndex]!.description.trim().length > 120 ? '…' : ''}»
                                </span>
                            ) : null}
                        </>
                    ) : undefined
                }
                confirmLabel="Sí, quitar"
                cancelLabel="Cancelar"
                variant="danger"
            />
        </form>
    );
}
