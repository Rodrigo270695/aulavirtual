/**
 * Modal genérico y reutilizable.
 *
 * Comportamiento:
 *   - Se cierra con: botón X, Escape, o botón "Cancelar" del footer.
 *   - NO se cierra al hacer click fuera del modal.
 *   - Altura máxima = 90% del viewport; el body hace scroll si el contenido
 *     lo supera (útil en pantallas pequeñas o con muchos permisos).
 *
 * Se usa en todas las vistas del panel: roles, usuarios, cursos, etc.
 */

import type { ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

const SIZE_CLASS: Record<ModalSize, string> = {
    sm:    'sm:max-w-sm',
    md:    'sm:max-w-md',
    lg:    'sm:max-w-lg',
    xl:    'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    full:  'max-w-[96vw] sm:max-w-[96vw]',
};

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
    description?: ReactNode;
    size?: ModalSize;
    footer?: ReactNode;
    children: ReactNode;
}

export function Modal({
    open,
    onClose,
    title,
    description,
    size = 'md',
    footer,
    children,
}: ModalProps) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent
                className={cn(
                    // Layout flex-col para que header/footer sean fijos y body haga scroll
                    'flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0',
                    // Botón cerrar (último hijo absoluto de Radix): legible sobre la cabecera tintada
                    '[&>button]:top-4 [&>button]:right-4 [&>button]:rounded-lg [&>button]:border [&>button]:border-slate-200/90 [&>button]:bg-white/95 [&>button]:p-1.5 [&>button]:shadow-sm [&>button]:opacity-100 [&>button]:hover:bg-white [&>button]:hover:text-slate-900',
                    SIZE_CLASS[size],
                )}
                // ── Bloquear cierre al hacer click fuera ──────────────────
                onInteractOutside={(e) => e.preventDefault()}
                // ── Permitir cerrar solo con Escape ────────────────────────
                onEscapeKeyDown={onClose}
            >
                {/* ── Header (fijo arriba) — banda visible + espacio para la X de Radix ── */}
                <DialogHeader className="shrink-0 border-b border-blue-200/70 bg-linear-to-r from-blue-50 via-indigo-50/40 to-slate-50 px-6 py-4 pr-14 shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset]">
                    <div className="flex items-start gap-3">
                        <span
                            className="mt-0.5 hidden h-9 w-1 shrink-0 rounded-full bg-linear-to-b from-blue-600 to-indigo-500 sm:block"
                            aria-hidden
                        />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
                                {title}
                            </DialogTitle>
                            {description && (
                                <DialogDescription asChild className="text-[13px] leading-relaxed text-slate-600">
                                    <div>{description}</div>
                                </DialogDescription>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {/* ── Body (hace scroll si el contenido lo supera) ── */}
                <div className="flex-1 overflow-y-auto bg-white px-6 py-5">
                    {children}
                </div>

                {/* ── Footer (fijo abajo) — barra de acciones claramente separada ── */}
                {footer && (
                    <DialogFooter className="shrink-0 gap-3 border-t-2 border-slate-200/90 bg-linear-to-b from-slate-100 to-slate-50/95 px-6 py-4 shadow-[0_-6px_16px_-4px_rgba(15,23,42,0.08)]">
                        {footer}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
