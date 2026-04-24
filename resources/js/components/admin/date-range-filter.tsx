import { X } from 'lucide-react';
import { DateFilterInput } from '@/components/admin/date-filter-input';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
    from?: string;
    to?: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    onClear?: () => void;
    fromId?: string;
    toId?: string;
    className?: string;
}

export function DateRangeFilter({
    from,
    to,
    onFromChange,
    onToChange,
    onClear,
    fromId = 'date-from',
    toId = 'date-to',
    className,
}: DateRangeFilterProps) {
    const hasValue = Boolean(from || to);

    return (
        <div
            className={cn(
                'grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]',
                className,
            )}
        >
            <DateFilterInput
                id={fromId}
                label="Fecha desde"
                value={from}
                onChange={onFromChange}
                max={to || undefined}
            />
            <DateFilterInput
                id={toId}
                label="Fecha hasta"
                value={to}
                onChange={onToChange}
                min={from || undefined}
            />
            {onClear && hasValue ? (
                <button
                    type="button"
                    onClick={onClear}
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 sm:col-span-2 2xl:col-span-1 2xl:w-auto"
                >
                    <X className="size-3.5" />
                    Limpiar
                </button>
            ) : null}
        </div>
    );
}
