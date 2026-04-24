/**
 * Modal para valorar el curso al completarlo (reseña + estrellas).
 */

import { Star } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { appToastQueue } from '@/lib/app-toast-queue';
import { cn } from '@/lib/utils';
import learning from '@/routes/learning';

type Props = {
    open: boolean;
    onClose: () => void;
    enrollmentId: string;
    courseTitle: string;
    onSubmitted: () => void;
};

export function CourseReviewModal({ open, onClose, enrollmentId, courseTitle, onSubmitted }: Props) {
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [reviewText, setReviewText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const reset = useCallback(() => {
        setRating(5);
        setTitle('');
        setReviewText('');
    }, []);

    const handleClose = useCallback(() => {
        reset();
        onClose();
    }, [onClose, reset]);

    const submit = useCallback(async () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!token) {
            appToastQueue.add({ title: 'Recarga la página e inténtalo de nuevo.', variant: 'danger' }, { timeout: 6000 });
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(learning.courseReview.store.url({ enrollment: enrollmentId }), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    rating,
                    ...(title.trim() ? { title: title.trim() } : {}),
                    ...(reviewText.trim() ? { review_text: reviewText.trim() } : {}),
                }),
            });
            const body = (await res.json().catch(() => ({}))) as {
                ok?: boolean;
                message?: string;
                errors?: Record<string, string[]>;
            };
            if (!res.ok || !body.ok) {
                const fromValidation =
                    body.errors && typeof body.errors === 'object'
                        ? (Object.values(body.errors).flat().find((m) => typeof m === 'string' && m.length > 0) as
                              | string
                              | undefined)
                        : undefined;
                const msg =
                    fromValidation ??
                    (typeof body.message === 'string' ? body.message : `No se pudo guardar (${res.status})`);
                appToastQueue.add({ title: msg, variant: 'danger' }, { timeout: 6000 });
                return;
            }
            appToastQueue.add({ title: '¡Gracias por tu valoración!', variant: 'success' }, { timeout: 5000 });
            onSubmitted();
            handleClose();
        } catch {
            appToastQueue.add({ title: 'Error de red. Inténtalo de nuevo.', variant: 'danger' }, { timeout: 6000 });
        } finally {
            setSubmitting(false);
        }
    }, [enrollmentId, rating, title, reviewText, onSubmitted, handleClose]);

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="¿Qué te pareció el curso?"
            description={`Valoración de «${courseTitle}». Tu opinión ayuda a otros estudiantes.`}
            size="lg"
            footer={
                <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
                        Ahora no
                    </Button>
                    <Button
                        type="button"
                        className="font-semibold"
                        disabled={submitting}
                        onClick={() => void submit()}
                    >
                        {submitting ? 'Enviando…' : 'Publicar valoración'}
                    </Button>
                </div>
            }
        >
            <div className="space-y-5">
                <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Puntuación</p>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button
                                key={n}
                                type="button"
                                disabled={submitting}
                                onClick={() => setRating(n)}
                                className="rounded-lg p-1 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                aria-label={`${n} estrella${n === 1 ? '' : 's'}`}
                            >
                                <Star
                                    className={cn(
                                        'size-9',
                                        n <= rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200',
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{rating} de 5</p>
                </div>
                <div>
                    <label htmlFor="course-review-title" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Título (opcional)
                    </label>
                    <Input
                        id="course-review-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={255}
                        placeholder="Ej.: Muy claro para empezar"
                        disabled={submitting}
                    />
                </div>
                <div>
                    <label htmlFor="course-review-text" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Comentario (opcional)
                    </label>
                    <textarea
                        id="course-review-text"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        maxLength={8000}
                        rows={4}
                        disabled={submitting}
                        placeholder="Qué te gustó, qué mejorarías…"
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
            </div>
        </Modal>
    );
}
