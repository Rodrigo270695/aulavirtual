/**
 * DataTable — tabla genérica con vista de cards en móvil/tablet.
 *
 *  < lg  →  grid de cards  (celulares y tablets)
 *  ≥ lg  →  tabla clásica  (desktop)
 *
 * Las columnas usan:
 *   cardPrimary  → título / cabecera del card
 *   cardFooter   → pie del card (acciones)
 *   hideInCard   → se omite en vista card
 */

import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Column } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DataTableProps<T = any> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyText?: string;
    emptyIcon?: ReactNode;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    onSort?: (key: string) => void;
    header?: ReactNode;
    footer?: ReactNode;
    className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T = any>({
    columns,
    data,
    loading = false,
    emptyText = 'No hay registros para mostrar.',
    emptyIcon,
    sortBy,
    sortDir,
    onSort,
    header,
    footer,
    className,
}: DataTableProps<T>) {

    const primaryCols = columns.filter((c) => c.cardPrimary);
    const bodyCols    = columns.filter((c) => !c.cardPrimary && !c.cardFooter && !c.hideInCard);
    const footerCols  = columns.filter((c) => c.cardFooter);

    const emptyState = (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            {emptyIcon ?? (
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <span className="text-2xl">📭</span>
                </div>
            )}
            <span className="text-sm">{emptyText}</span>
        </div>
    );

    const loadingState = (
        <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary/60" />
            <span className="text-sm">Cargando...</span>
        </div>
    );

    return (
        <div className={cn('overflow-hidden rounded-xl border border-border bg-card shadow-sm', className)}>

            {/* ── Header slot ── */}
            {header && (
                <div className="border-b border-border bg-muted/30 px-4 py-3">
                    {header}
                </div>
            )}

            {/* ══ TABLA — desktop (≥ lg) ════════════════════════════════════ */}
            <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b-2 border-border">
                            {columns.map((col) => {
                                const sortKey  = col.sortKey ?? col.key;
                                const isActive = sortBy === sortKey;
                                const canSort  = col.sortable && onSort;

                                return (
                                    <th
                                        key={col.key}
                                        onClick={() => canSort && onSort(sortKey)}
                                        className={cn(
                                            'select-none px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider transition-colors',
                                            isActive ? 'text-primary' : 'text-muted-foreground',
                                            canSort && 'cursor-pointer hover:text-primary',
                                            col.headerClassName,
                                        )}
                                    >
                                        <span className="inline-flex items-center gap-1.5">
                                            {col.header}
                                            {col.sortable && (
                                                <SortIcon active={isActive} dir={sortDir} />
                                            )}
                                        </span>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-border/60">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center">
                                    {loadingState}
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center">
                                    {emptyState}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, i) => (
                                <tr key={i} className="transition-colors hover:bg-primary/3">
                                    {columns.map((col) => {
                                        const sortKey  = col.sortKey ?? col.key;
                                        const isActive = sortBy === sortKey && col.sortable;

                                        return (
                                            <td
                                                key={col.key}
                                                className={cn(
                                                    'px-4 py-3 text-foreground/80',
                                                    isActive && 'bg-primary/2',
                                                    col.className,
                                                )}
                                            >
                                                {col.cell(row)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ══ CARDS — móvil / tablet (< lg) ════════════════════════════ */}
            <div className="lg:hidden">
                {loading ? (
                    loadingState
                ) : data.length === 0 ? (
                    emptyState
                ) : (
                    <div className="flex flex-col gap-3 p-3">
                        {data.map((row, i) => (
                            <MobileCard
                                key={i}
                                row={row}
                                primaryCols={primaryCols}
                                bodyCols={bodyCols}
                                footerCols={footerCols}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Footer slot ── */}
            {footer && (
                <div className="border-t border-border bg-muted/30 px-4 py-3">
                    {footer}
                </div>
            )}
        </div>
    );
}

// ─── Card individual ──────────────────────────────────────────────────────────
//
//  ┌──────────────────────────────────────────┐
//  │ gradient   [icono] Título                │  ← cabecera
//  ├──────────────────────────────────────────┤
//  │  rejilla 1–2 columnas: todo visible      │  ← sin scroll horizontal
//  │  (teléfono: 1 col · sm+: 2 cols)         │
//  ├──────────────────────────────────────────┤
//  │  [Editar]  [Eliminar]  ...               │  ← pie: acciones
//  └──────────────────────────────────────────┘

function MobileCard<T>({
    row,
    primaryCols,
    bodyCols,
    footerCols,
}: {
    row: T;
    primaryCols: Column<T>[];
    bodyCols: Column<T>[];
    footerCols: Column<T>[];
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">

            {/* ── Cabecera: solo título, texto siempre truncado ── */}
            <div
                className="min-w-0 px-4 py-3"
                style={{
                    background: 'linear-gradient(135deg, color-mix(in oklch, var(--primary) 5%, var(--card)), color-mix(in oklch, var(--primary) 2%, var(--card)))',
                    borderBottom: '1px solid color-mix(in oklch, var(--primary) 12%, var(--border))',
                }}
            >
                {primaryCols.length > 0
                    ? primaryCols.map((col) => (
                        <div key={col.key} className="min-w-0">
                            {(col.cardCell ?? col.cell)(row)}
                        </div>
                    ))
                    : null}
            </div>

            {/* ── Campos: rejilla vertical-friendly (sin deslizar lateral) ── */}
            {bodyCols.length > 0 && (
                <div className="grid grid-cols-1 gap-x-5 gap-y-3 px-4 py-3 sm:grid-cols-2">
                    {bodyCols.map((col) => (
                        <div key={col.key} className="min-w-0">
                            <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                {col.header}
                            </span>
                            <div className="min-w-0 text-sm break-words text-foreground/80">
                                {(col.cardCell ?? col.cell)(row)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Barra de acciones: etiquetadas, en su propia fila ── */}
            {footerCols.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 border-t border-border/60 bg-muted/20 px-3 py-2">
                    {footerCols.map((col) => (
                        <div key={col.key}>
                            {(col.cardCell ?? col.cell)(row)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Icono de ordenamiento ────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir?: 'asc' | 'desc' }) {
    if (!active) {
        return <ArrowUpDown className="size-3 opacity-40 transition-opacity group-hover:opacity-80" />;
    }

    return dir === 'asc'
        ? <ArrowUp   className="size-3 text-primary" />
        : <ArrowDown className="size-3 text-primary" />;
}
