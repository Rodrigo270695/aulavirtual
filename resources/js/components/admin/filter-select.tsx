/**
 * FilterSelect — selector desplegable para filtros y formularios compactos.
 *
 * Basado en Radix Select (misma base que shadcn): panel con sombra, ítems redondeados
 * y estados de foco alineados con DataFilters / inputs admin.
 * También se usa en el marketplace (Explora cursos, Mi aprendizaje); `size="md"` para triggers más cómodos.
 */

import type { ReactNode } from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface FilterSelectOption {
    value: string;
    label: string;
}

/** Radix Select no permite SelectItem con value=""; hacia fuera seguimos usando "". */
export const FILTER_SELECT_ALL_VALUE = '__all__';

export interface FilterSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: FilterSelectOption[];
    /** Primera opción «todos»; en UI usa un valor interno y `onValueChange("")` al elegirla. */
    allOptionLabel?: string;
    /** Título dentro del panel (mayúsculas pequeñas, separa visualmente el bloque). */
    contentLabel?: string;
    placeholder?: string;
    icon?: ReactNode;
    disabled?: boolean;
    id?: string;
    'aria-label'?: string;
    className?: string;
    triggerClassName?: string;
    contentClassName?: string;
    /** `sm` = compacto (panel admin); `md` = más alto y redondeado (marketplace / filtros públicos). */
    size?: 'sm' | 'md';
}

const itemClassName = cn(
    'cursor-pointer rounded-lg py-2 pl-2.5 pr-8 text-sm text-slate-700 outline-none transition-colors',
    'data-highlighted:bg-slate-100 data-highlighted:text-slate-900',
    'data-[state=checked]:bg-blue-50 data-[state=checked]:font-semibold data-[state=checked]:text-blue-800',
);

const contentStyles = cn(
    'z-50 max-h-72 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5',
    'shadow-xl shadow-slate-300/25',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
);

export function FilterSelect({
    value,
    onValueChange,
    options,
    allOptionLabel,
    contentLabel,
    placeholder = 'Seleccionar…',
    icon,
    disabled,
    id,
    'aria-label': ariaLabel,
    className,
    triggerClassName,
    contentClassName,
    size = 'sm',
}: FilterSelectProps) {
    const isAll = !value || value === '';
    const radixValue = allOptionLabel && isAll ? FILTER_SELECT_ALL_VALUE : value;

    const handleChange = (v: string) => {
        if (allOptionLabel && v === FILTER_SELECT_ALL_VALUE) {
            onValueChange('');
        } else {
            onValueChange(v);
        }
    };

    return (
        <div className={cn('relative w-full min-w-0', className)}>
            {icon ? (
                <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400 [&_svg]:size-3.5">
                    {icon}
                </span>
            ) : null}
            <Select value={radixValue} onValueChange={handleChange} disabled={disabled}>
                <SelectTrigger
                    id={id}
                    aria-label={ariaLabel}
                    className={cn(
                        'w-full min-w-0 max-w-full overflow-hidden border border-slate-200 bg-white text-sm text-slate-700',
                        'focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                        'data-placeholder:text-slate-500 [&>svg]:shrink-0 [&>svg]:text-slate-400',
                        '[&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate',
                        size === 'md'
                            ? 'h-10 rounded-xl border-slate-200/90 px-3 shadow-sm hover:border-slate-300/90'
                            : 'h-9 rounded-lg shadow-none',
                        icon ? 'pl-9' : 'pl-3',
                        triggerClassName,
                    )}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent
                    position="popper"
                    sideOffset={6}
                    align="start"
                    className={cn(contentStyles, 'min-w-(--radix-select-trigger-width)', contentClassName)}
                >
                    <SelectGroup>
                        {contentLabel ? (
                            <>
                                <SelectLabel className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    {contentLabel}
                                </SelectLabel>
                                <SelectSeparator className="mb-1 bg-slate-200" />
                            </>
                        ) : null}
                        {allOptionLabel ? (
                            <SelectItem value={FILTER_SELECT_ALL_VALUE} className={itemClassName}>
                                {allOptionLabel}
                            </SelectItem>
                        ) : null}
                        {options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className={itemClassName}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}
