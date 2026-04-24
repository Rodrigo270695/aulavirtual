/**
 * Miniatura clicable que abre la imagen a tamaño completo, limitada al viewport.
 * Reutilizable en tablas, tarjetas, etc.
 */

import * as React from 'react';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface ImagePreviewButtonProps {
    /** URL absoluta o ruta publicable (p. ej. `/storage/...`). */
    src: string | null | undefined;
    alt: string;
    /** Se muestra cuando no hay `src` (no abre vista previa). */
    fallback: React.ReactNode;
    /** Clases del botón miniatura (tamaño, borde). */
    className?: string;
    /** Clases de la imagen dentro del botón. */
    thumbImgClassName?: string;
}

export function ImagePreviewButton({
    src,
    alt,
    fallback,
    className,
    thumbImgClassName,
}: ImagePreviewButtonProps) {
    const [open, setOpen] = React.useState(false);

    if (!src) {
        return (
            <div
                className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-lg',
                    className,
                )}
                aria-hidden
            >
                {fallback}
            </div>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={cn(
                    'relative flex size-7 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-slate-200/90 bg-slate-50',
                    'transition-shadow outline-none hover:border-blue-300 hover:shadow-sm',
                    'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                    className,
                )}
                aria-label={`Ver imagen a tamaño completo: ${alt}`}
            >
                <img
                    src={src}
                    alt=""
                    className={cn('size-full object-cover', thumbImgClassName)}
                    draggable={false}
                />
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className={cn(
                        'max-h-[min(92dvh,calc(100vh-2rem))] w-[min(calc(100vw-2rem),1400px)] max-w-none translate-x-[-50%] translate-y-[-50%]',
                        'gap-0 border border-slate-200/90 bg-white p-2 shadow-2xl sm:max-w-none',
                        // Botón cerrar (último hijo en `dialog.tsx`): contraste claro sobre fondo blanco
                        '[&>button]:top-3 [&>button]:right-3 [&>button]:rounded-full [&>button]:border [&>button]:border-slate-300',
                        '[&>button]:bg-white [&>button]:p-2 [&>button]:text-slate-800 [&>button]:opacity-100 [&>button]:shadow-md',
                        '[&>button]:hover:border-slate-400 [&>button]:hover:bg-slate-50 [&>button]:hover:text-slate-900',
                    )}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogTitle className="sr-only">{alt}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Vista previa ampliada. Cierra con el botón X, Escape o haciendo clic fuera del cuadro.
                    </DialogDescription>
                    <div className="flex max-h-[min(85dvh,calc(100vh-4rem))] w-full items-center justify-center overflow-auto rounded-md bg-slate-50/90 px-1 py-2">
                        <img
                            src={src}
                            alt={alt}
                            className="max-h-full max-w-full object-contain"
                            draggable={false}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
