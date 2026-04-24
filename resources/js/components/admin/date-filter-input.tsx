import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateFilterInputProps {
    id: string;
    label: string;
    value?: string;
    onChange: (value: string) => void;
    min?: string;
    max?: string;
    className?: string;
}

export function DateFilterInput({
    id,
    label,
    value,
    onChange,
    min,
    max,
    className,
}: DateFilterInputProps) {
    return (
        <div className={cn('relative min-w-0 flex-1', className)}>
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
                id={id}
                type="date"
                aria-label={label}
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                min={min}
                max={max}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700
                           focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
        </div>
    );
}
