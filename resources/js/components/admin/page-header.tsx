/**
 * PageHeader — cabecera reutilizable para vistas de administración.
 *
 *  ┌─────────────────────────────────────────────────────────┐
 *  │ ░░ icono/pattern ░░   Título               [Acción]    │
 *  │                       Descripción                      │
 *  │  ── chip ── chip ── chip ──                            │
 *  └─────────────────────────────────────────────────────────┘
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface StatChip {
    label: string;
    value: string | number;
    icon?: ReactNode;
    color?: 'blue' | 'purple' | 'green' | 'teal' | 'orange' | 'rose' | 'slate';
}

interface PageHeaderProps {
    title: string;
    description?: string;
    /** Icono grande decorativo (aparece en el fondo izquierdo del card) */
    icon?: ReactNode;
    stats?: StatChip[];
    actions?: ReactNode;
    className?: string;
}

const COLOR_MAP: Record<NonNullable<StatChip['color']>, { chip: string; dot: string }> = {
    blue:   { chip: 'bg-blue-50/80   text-blue-700   border-blue-200/60',   dot: 'bg-blue-400'   },
    purple: { chip: 'bg-purple-50/80 text-purple-700 border-purple-200/60', dot: 'bg-purple-400' },
    green:  { chip: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60', dot: 'bg-emerald-400' },
    teal:   { chip: 'bg-teal-50/80   text-teal-700   border-teal-200/60',   dot: 'bg-teal-400'   },
    orange: { chip: 'bg-orange-50/80 text-orange-700 border-orange-200/60', dot: 'bg-orange-400' },
    rose:   { chip: 'bg-rose-50/80   text-rose-700   border-rose-200/60',   dot: 'bg-rose-400'   },
    slate:  { chip: 'bg-slate-100/80 text-slate-500  border-slate-200',     dot: 'bg-slate-400'  },
};

export function PageHeader({ title, description, icon, stats, actions, className }: PageHeaderProps) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-xl border border-border bg-card px-5 py-4 shadow-sm',
                className,
            )}
        >
            {/* ── Patrón de puntos decorativo (fondo) ── */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        'radial-gradient(circle, var(--primary) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                }}
            />

            {/* ── Brillo de acento arriba-izquierda ── */}
            <div
                aria-hidden
                className="pointer-events-none absolute -left-8 -top-8 size-40 rounded-full opacity-10 blur-2xl"
                style={{ background: 'var(--primary)' }}
            />

            {/* ── Contenido ── */}
            <div className="relative flex flex-col gap-3">

                {/* Fila: título + botón */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    {/* Izquierda: icono + textos */}
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div
                                className="flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm"
                                style={{
                                    background: 'linear-gradient(135deg, color-mix(in oklch, var(--primary) 15%, white), color-mix(in oklch, var(--primary) 30%, white))',
                                    border: '1px solid color-mix(in oklch, var(--primary) 25%, transparent)',
                                }}
                            >
                                <span className="text-primary [&_svg]:size-5">
                                    {icon}
                                </span>
                            </div>
                        )}

                        <div className={cn('border-l-[3px] border-primary pl-3', !icon && '')}>
                            <h1 className="text-base font-bold leading-tight text-foreground sm:text-lg">
                                {title}
                            </h1>
                            {description && (
                                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Derecha: acciones */}
                    {actions && (
                        <div className="flex shrink-0 items-center gap-2">
                            {actions}
                        </div>
                    )}
                </div>

                {/* Chips de estadísticas */}
                {stats && stats.length > 0 && (
                    <>
                        {/* Divisor */}
                        <div className="h-px bg-linear-to-r from-primary/20 via-border to-transparent" />

                        <div className="flex flex-wrap items-center gap-2">
                            {stats.map((stat, i) => {
                                const key = stat.color ?? 'blue';
                                const { chip, dot } = COLOR_MAP[key] ?? COLOR_MAP.blue;

                                return (
                                    <span
                                        key={i}
                                        className={cn(
                                            'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm',
                                            chip,
                                        )}
                                    >
                                        {stat.icon ? (
                                            <span className="flex size-3.5 shrink-0 items-center justify-center [&_svg]:size-3.5">
                                                {stat.icon}
                                            </span>
                                        ) : (
                                            <span className={cn('size-1.5 shrink-0 rounded-full', dot)} />
                                        )}
                                        <span className="text-current/80">{stat.label}</span>
                                        <span
                                            className={cn(
                                                'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                                                chip.replace('bg-', 'bg-').replace('/80', ''),
                                            )}
                                            style={{ background: 'color-mix(in oklch, currentColor 12%, transparent)' }}
                                        >
                                            {stat.value}
                                        </span>
                                    </span>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
