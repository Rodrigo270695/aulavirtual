/**
 * Cinta no intrusiva para abrir el modal de reseña si el alumno completó el curso y aún no valora.
 */

import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
    courseTitle: string;
    onOpen: () => void;
    onDismiss: () => void;
};

export function CourseReviewPromptBanner({ courseTitle, onOpen, onDismiss }: Props) {
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200/90 bg-linear-to-r from-amber-50/95 to-orange-50/80 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-amber-100">
                    <Star className="size-5 fill-amber-400 text-amber-400" aria-hidden />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">¡Curso completado!</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                        ¿Te gustaría valorar <span className="font-medium text-slate-800">«{courseTitle}»</span>? Solo
                        te lleva un momento.
                    </p>
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:pl-2">
                <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={onDismiss}>
                    <X className="mr-1 size-3.5" aria-hidden />
                    Cerrar
                </Button>
                <Button
                    type="button"
                    size="sm"
                    className="rounded-lg font-semibold text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #d97706, #ea580c)' }}
                    onClick={onOpen}
                >
                    Valorar curso
                </Button>
            </div>
        </div>
    );
}
