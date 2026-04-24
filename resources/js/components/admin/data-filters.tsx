/**
 * DataFilters — barra de filtros genérica y reutilizable.
 *
 * Incluye: búsqueda por texto + selector de registros por página.
 * Acepta children para filtros adicionales específicos de cada vista.
 *
 * Uso:
 *   <DataFilters
 *     search={filters.search}
 *     onSearch={(v) => applyFilter({ search: v })}
 *     perPage={filters.per_page}
 *     onPerPage={(v) => applyFilter({ per_page: v })}
 *   >
 *     <MyExtraFilter />
 *   </DataFilters>
 */

import type { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface DataFiltersProps {
    /** Acepta string | null | undefined — siempre se normaliza a string */
    search?: string | null;
    onSearch: (value: string) => void;
    placeholder?: string;
    children?: ReactNode;
    className?: string;
}

export function DataFilters({
    search,
    onSearch,
    placeholder = 'Buscar...',
    children,
    className,
}: DataFiltersProps) {
    const normalized = search ?? '';
    const [localSearch, setLocalSearch] = useState(normalized);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sincroniza el estado local cuando la prop cambia (navegación atrás/adelante)
    useEffect(() => {
        setLocalSearch(search ?? '');
    }, [search]);

    const handleSearch = useCallback(
        (value: string) => {
            setLocalSearch(value);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => onSearch(value), 350);
        },
        [onSearch],
    );

    const clearSearch = () => {
        setLocalSearch('');
        onSearch('');
    };

    return (
        <div className={cn('flex flex-col gap-3', className)}>
            {/* Búsqueda: ancho completo en móvil para que los filtros pasen a la siguiente línea con sitio */}
            <div className="relative w-full min-w-0">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={localSearch ?? ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={placeholder}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-700 placeholder:text-slate-400
                               focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {localSearch && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X className="size-3.5" />
                    </button>
                )}
            </div>

            {/* Filtros extra: siempre ocupan el ancho disponible (evita 4 selects en una tira estrecha) */}
            {children ? <div className="w-full min-w-0">{children}</div> : null}
        </div>
    );
}
