/**
 * CourseFichaTabs — pestañas para la ficha de venta del curso (estilo admin: borde, activo azul).
 */

import { cn } from '@/lib/utils';

export type CourseFichaTabId = 'objectives' | 'requirements' | 'audience';

export interface CourseFichaTabDef {
    id: CourseFichaTabId;
    label: string;
}

const DEFAULT_TABS: CourseFichaTabDef[] = [
    { id: 'objectives', label: 'Objetivos' },
    { id: 'requirements', label: 'Requisitos' },
    { id: 'audience', label: 'Público objetivo' },
];

interface Props {
    active: CourseFichaTabId;
    onChange: (id: CourseFichaTabId) => void;
    tabs?: CourseFichaTabDef[];
    className?: string;
}

export function CourseFichaTabs({ active, onChange, tabs = DEFAULT_TABS, className }: Props) {
    return (
        <div
            className={cn(
                'flex flex-wrap gap-1 rounded-xl border border-slate-200/90 bg-slate-50/80 p-1 shadow-sm',
                className,
            )}
            role="tablist"
            aria-label="Secciones de la ficha de venta"
        >
            {tabs.map((t) => (
                <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active === t.id}
                    onClick={() => onChange(t.id)}
                    className={cn(
                        'min-h-9 flex-1 rounded-lg px-3 py-2 text-center text-xs font-semibold transition-all sm:min-w-0 sm:flex-none sm:px-5 sm:text-sm',
                        active === t.id
                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/80'
                            : 'text-slate-500 hover:bg-white/60 hover:text-slate-700',
                    )}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}
