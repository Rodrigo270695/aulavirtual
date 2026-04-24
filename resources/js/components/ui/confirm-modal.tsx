/**
 * ConfirmModal — modal de confirmación genérico y reutilizable.
 *
 * Ideal para acciones destructivas (eliminar, desactivar, etc.).
 * El botón de confirmación acepta variantes de color para transmitir
 * la gravedad de la acción (danger = rojo, warning = amarillo, etc.).
 *
 * Uso:
 *   <ConfirmModal
 *     open={deleteOpen}
 *     onClose={() => setDeleteOpen(false)}
 *     onConfirm={handleDelete}
 *     title="Eliminar rol"
 *     description="¿Estás seguro de que deseas eliminar..."
 *     confirmLabel="Sí, eliminar"
 *     loading={processing}
 *   />
 */

import { AlertTriangle } from 'lucide-react';
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

type ConfirmVariant = 'danger' | 'warning' | 'info';

const VARIANT_STYLES: Record<ConfirmVariant, { icon: string; btn: string; iconBg: string }> = {
    danger: {
        icon:   'text-red-500',
        iconBg: 'bg-red-50',
        btn:    'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
    },
    warning: {
        icon:   'text-amber-500',
        iconBg: 'bg-amber-50',
        btn:    'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-400',
    },
    info: {
        icon:   'text-blue-500',
        iconBg: 'bg-blue-50',
        btn:    'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500',
    },
};

interface ConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
    loading?: boolean;
}

export function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel  = 'Cancelar',
    variant      = 'danger',
    loading      = false,
}: ConfirmModalProps) {
    const styles = VARIANT_STYLES[variant];

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent
                className="gap-0 overflow-hidden p-0 sm:max-w-md"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={onClose}
            >
                {/* ── Cuerpo ── */}
                <div className="flex items-start gap-4 px-6 py-6">
                    {/* Ícono */}
                    <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', styles.iconBg)}>
                        <AlertTriangle className={cn('size-5', styles.icon)} />
                    </div>

                    {/* Texto */}
                    <DialogHeader className="flex-1 gap-1 space-y-0 text-left">
                        <DialogTitle className="text-base font-semibold text-slate-800">
                            {title}
                        </DialogTitle>
                        {description && (
                            <DialogDescription className="text-sm leading-relaxed text-slate-500">
                                {description}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                </div>

                {/* ── Footer ── */}
                <DialogFooter className="border-t border-slate-100 bg-slate-50/60 px-6 py-3">
                    <div className="flex w-full items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className={cn(
                                'rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-60',
                                styles.btn,
                            )}
                        >
                            {loading ? 'Eliminando...' : confirmLabel}
                        </button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
