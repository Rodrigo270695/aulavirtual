import { useEffect, useLayoutEffect, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const EXIT_DURATION_MS = 360;

type Props = {
    open: boolean;
    onRequestClose: () => void;
    /** Posición, max-height, bordes, sombra del panel (incluye `fixed` si aplica) */
    panelClassName: string;
    panelProps?: Omit<ComponentPropsWithoutRef<'div'>, 'children'>;
    backdropClassName?: string;
    children: ReactNode;
};

/**
 * Overlay + panel móvil con entrada/salida suave (backdrop + deslizamiento leve + escala).
 * Bloquea scroll del body y cierra con Escape mientras está montado.
 */
export function MobileMenuAnimStack({
    open,
    onRequestClose,
    panelClassName,
    panelProps,
    backdropClassName,
    children,
}: Props) {
    const [visible, setVisible] = useState(open);
    const [entered, setEntered] = useState(false);

    useLayoutEffect(() => {
        let exitTimer: ReturnType<typeof setTimeout>;
        if (open) {
            setVisible(true);
            const id = requestAnimationFrame(() => {
                requestAnimationFrame(() => setEntered(true));
            });
            return () => cancelAnimationFrame(id);
        }
        setEntered(false);
        exitTimer = setTimeout(() => setVisible(false), EXIT_DURATION_MS);
        return () => clearTimeout(exitTimer);
    }, [open]);

    useEffect(() => {
        if (!visible) {
            return;
        }
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onRequestClose();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            document.removeEventListener('keydown', onKey);
        };
    }, [visible, onRequestClose]);

    if (!visible) {
        return null;
    }

    const { className: panelExtraClass, ...restPanelProps } = panelProps ?? {};

    return (
        <>
            <button
                type="button"
                aria-label="Cerrar"
                className={cn(
                    'fixed inset-x-0 bottom-0 top-14 z-40 bg-slate-950/60 backdrop-blur-[3px] transition-[opacity,backdrop-filter] duration-300 ease-out sm:top-16 lg:hidden',
                    entered ? 'opacity-100' : 'opacity-0',
                    backdropClassName,
                )}
                onClick={onRequestClose}
            />
            <div
                {...restPanelProps}
                className={cn(
                    panelClassName,
                    panelExtraClass,
                    'fixed z-45 transition-[opacity,transform] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,opacity] motion-reduce:transition-none motion-reduce:duration-0 lg:hidden',
                    entered
                        ? 'translate-y-0 scale-100 opacity-100'
                        : 'translate-y-5 scale-[0.96] opacity-0 motion-reduce:translate-y-0 motion-reduce:scale-100',
                )}
            >
                {children}
            </div>
        </>
    );
}
