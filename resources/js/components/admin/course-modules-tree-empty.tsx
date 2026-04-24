/**
 * Estado vacío: aún no hay módulos en el curso.
 */

import { Plus } from 'lucide-react';

interface Props {
    canCreate: boolean;
    onCreate: () => void;
}

export function CourseModulesTreeEmpty({ canCreate, onCreate }: Props) {
    return (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center text-sm text-slate-600">
            <p className="font-medium text-slate-800">Aún no hay módulos en este curso.</p>
            <p className="mx-auto mt-1 max-w-md">
                La estructura es en árbol: cada módulo agrupará lecciones. Crea el primero para empezar.
            </p>
            {canCreate && (
                <button
                    type="button"
                    onClick={onCreate}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                >
                    <Plus className="size-4" />
                    Crear primer módulo
                </button>
            )}
        </div>
    );
}
