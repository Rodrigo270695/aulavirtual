/**
 * useFlashToast — muestra toasts de HeroUI a partir de los mensajes flash de Laravel.
 *
 * Usa `router.on('navigate', ...)` en lugar de `usePage()` para poder
 * funcionar tanto dentro como fuera del contexto de Inertia (e.g. en withApp).
 *
 * El middleware HandleInertiaRequests comparte:
 *   flash.success | flash.error | flash.info | flash.warning
 */

import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { appToastQueue } from '@/lib/app-toast-queue';

interface Flash {
    success?: string | null;
    error?:   string | null;
    info?:    string | null;
    warning?: string | null;
}

function showFlash(flash: Flash | undefined): void {
    if (!flash) {
        return;
    }

    if (flash.success) {
        appToastQueue.add({ title: flash.success, variant: 'success' }, { timeout: 4000 });
    }

    if (flash.error) {
        appToastQueue.add({ title: flash.error, variant: 'danger' }, { timeout: 6000 });
    }

    if (flash.info) {
        appToastQueue.add({ title: flash.info, variant: 'accent' }, { timeout: 4000 });
    }

    if (flash.warning) {
        appToastQueue.add({ title: flash.warning, variant: 'warning' }, { timeout: 5000 });
    }
}


export function useFlashToast(): void {
    useEffect(() => {
        /**
         * 'success' → se dispara en TODA operación exitosa de Inertia:
         *   router.post(), router.put(), router.delete(), router.get()
         *   incluyendo preserveScroll / preserveState.
         *
         * 'navigate' → solo se dispara en navegación completa entre páginas,
         *   no en peticiones CRUD con preserveScroll.
         */
        const removeSuccess = router.on('success', (event) => {
            const flash = (event.detail.page.props as { flash?: Flash }).flash;
            showFlash(flash);
        });

        return removeSuccess;
    }, []);
}
