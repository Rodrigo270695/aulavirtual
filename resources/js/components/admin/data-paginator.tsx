/**
 * DataPaginator — paginador genérico con selector de registros por página.
 *
 * Mobile  : info arriba centrada · nav centrada · selector abajo centrado
 * Tablet+ : [info · selector]  ←————————→  [nav buttons]
 */

import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { PaginatedData } from '@/types';

const PER_PAGE_OPTIONS = [5, 10, 15, 25, 50, 100];

interface DataPaginatorProps<T> {
    meta: PaginatedData<T>;
    onPageChange: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    /** Si se omite, usa el selector estándar (5…100). */
    perPageOptions?: number[];
    className?: string;
    /** Texto después del total (p. ej. `cursos` → «… de 24 cursos»). */
    resourceName?: string;
    /** Degradado del botón de página activa. Por defecto azul estándar del admin. */
    activePageBackground?: string;
    /** No renderiza nada si solo hay una página (útil en listados compactos). */
    omitWhenSinglePage?: boolean;
}

const DEFAULT_ACTIVE_PAGE_BG = 'linear-gradient(135deg, #1d4ed8, #3b82f6)';

export function DataPaginator<T>({
    meta,
    onPageChange,
    onPerPageChange,
    perPageOptions,
    className,
    resourceName,
    activePageBackground,
    omitWhenSinglePage,
}: DataPaginatorProps<T>) {
    const { current_page, last_page, from, to, total, per_page } = meta;
    const pageSizeChoices = perPageOptions ?? PER_PAGE_OPTIONS;

    const canPrev  = current_page > 1;
    const canNext  = current_page < last_page;

    // En móvil mostramos rango reducido (solo current ±1) para no desbordar
    const pagesDesktop = buildPageRange(current_page, last_page, 1);
    const pagesMobile  = buildPageRange(current_page, last_page, 0);

    const activeBg = activePageBackground ?? DEFAULT_ACTIVE_PAGE_BG;

    const info = from !== null && to !== null
        ? (
            <>
                Mostrando <strong className="text-slate-800">{from}–{to}</strong> de{' '}
                <strong className="text-slate-800">{total}</strong>
                {resourceName ? <> {resourceName}</> : null}
            </>
        )
        : (<>Sin resultados</>);

    if (omitWhenSinglePage && last_page <= 1) {
        return null;
    }

    return (
        <div className={cn('w-full', className)}>

            {/* ══ MÓVIL (< sm) ══════════════════════════════════════════════ */}
            <div className="flex flex-col items-center gap-3 sm:hidden">

                {/* Fila 1: info de resultados */}
                <p className="text-xs text-slate-500">{info}</p>

                {/* Fila 2: navegación compacta */}
                {last_page > 1 && (
                    <div className="flex items-center gap-1">
                        <PagBtn onClick={() => onPageChange(1)} disabled={!canPrev} title="Primera">
                            <ChevronsLeft className="size-3.5" />
                        </PagBtn>
                        <PagBtn onClick={() => onPageChange(current_page - 1)} disabled={!canPrev} title="Anterior">
                            <ChevronLeft className="size-3.5" />
                        </PagBtn>

                        {pagesMobile.map((p, i) =>
                            p === '...' ? (
                                <span key={`d${i}`} className="px-0.5 text-xs text-slate-400">…</span>
                            ) : (
                                <PagBtn
                                    key={p}
                                    onClick={() => onPageChange(p as number)}
                                    active={p === current_page}
                                    activeBackground={activeBg}
                                >
                                    {p}
                                </PagBtn>
                            ),
                        )}

                        <PagBtn onClick={() => onPageChange(current_page + 1)} disabled={!canNext} title="Siguiente">
                            <ChevronRight className="size-3.5" />
                        </PagBtn>
                        <PagBtn onClick={() => onPageChange(last_page)} disabled={!canNext} title="Última">
                            <ChevronsRight className="size-3.5" />
                        </PagBtn>
                    </div>
                )}

                {/* Fila 3: selector de registros */}
                {onPerPageChange && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Mostrar</span>
                        <PerPageSelect value={per_page} options={pageSizeChoices} onChange={onPerPageChange} dropUp />
                        <span>registros</span>
                    </div>
                )}
            </div>

            {/* ══ TABLET / DESKTOP (≥ sm) ═══════════════════════════════════ */}
            <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-4">

                {/* Izquierda: info + selector */}
                <div className="flex items-center gap-2.5 text-xs text-slate-500">
                    <span>{info}</span>
                    {onPerPageChange && (
                        <>
                            <span className="h-3.5 w-px bg-slate-200" />
                            <span>Mostrar</span>
                            <PerPageSelect value={per_page} options={pageSizeChoices} onChange={onPerPageChange} dropUp />
                            <span>registros</span>
                        </>
                    )}
                </div>

                {/* Derecha: botones de página */}
                {last_page > 1 && (
                    <div className="flex items-center gap-1">
                        <PagBtn onClick={() => onPageChange(1)} disabled={!canPrev} title="Primera página">
                            <ChevronsLeft className="size-3.5" />
                        </PagBtn>
                        <PagBtn onClick={() => onPageChange(current_page - 1)} disabled={!canPrev} title="Anterior">
                            <ChevronLeft className="size-3.5" />
                        </PagBtn>

                        {pagesDesktop.map((p, i) =>
                            p === '...' ? (
                                <span key={`d${i}`} className="px-1 text-xs text-slate-400">…</span>
                            ) : (
                                <PagBtn
                                    key={p}
                                    onClick={() => onPageChange(p as number)}
                                    active={p === current_page}
                                    activeBackground={activeBg}
                                >
                                    {p}
                                </PagBtn>
                            ),
                        )}

                        <PagBtn onClick={() => onPageChange(current_page + 1)} disabled={!canNext} title="Siguiente">
                            <ChevronRight className="size-3.5" />
                        </PagBtn>
                        <PagBtn onClick={() => onPageChange(last_page)} disabled={!canNext} title="Última página">
                            <ChevronsRight className="size-3.5" />
                        </PagBtn>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Selector de registros por página ────────────────────────────────────────

function PerPageSelect({
    value,
    options,
    onChange,
    dropUp = false,
}: {
    value: number;
    options: number[];
    onChange: (v: number) => void;
    dropUp?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handler);

        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium text-slate-700 transition-all',
                    open
                        ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40',
                )}
            >
                <span className="min-w-6 text-center font-semibold text-slate-800">{value}</span>
                <ChevronDown
                    className={cn(
                        'size-3 text-slate-400 transition-transform duration-150',
                        open && 'rotate-180',
                    )}
                />
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    className={cn(
                        'absolute left-0 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60',
                        dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
                    )}
                >
                    <div className="py-1">
                        {options.map((n) => {
                            const selected = n === value;

                            return (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => {
                                        onChange(n);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        'flex w-full items-center justify-between gap-6 px-3.5 py-2 text-xs transition-colors',
                                        selected
                                            ? 'bg-blue-50 font-semibold text-blue-700'
                                            : 'text-slate-600 hover:bg-slate-50',
                                    )}
                                >
                                    <span>{n}</span>
                                    {selected && <Check className="size-3 text-blue-500" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Botón de página ─────────────────────────────────────────────────────────

function PagBtn({
    onClick,
    disabled = false,
    active   = false,
    activeBackground,
    title,
    children,
}: {
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
    activeBackground?: string;
    title?: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                'flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-xs font-medium transition-all',
                active
                    ? 'text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                disabled && 'cursor-not-allowed opacity-30',
            )}
            style={active ? { background: activeBackground ?? DEFAULT_ACTIVE_PAGE_BG } : undefined}
        >
            {children}
        </button>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * @param siblings - páginas a cada lado de la actual (1 = desktop, 0 = mobile)
 */
function buildPageRange(current: number, total: number, siblings = 1): (number | '...')[] {
    if (total <= 2 + siblings * 2 + 3) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [1];

    if (current > siblings + 2) {
        pages.push('...');
    }

    for (let i = Math.max(2, current - siblings); i <= Math.min(total - 1, current + siblings); i++) {
        pages.push(i);
    }

    if (current < total - siblings - 1) {
        pages.push('...');
    }

    pages.push(total);

    return pages;
}
