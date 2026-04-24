/**
 * AppToastProvider — monta el Toast.Provider de HeroUI y escucha
 * los mensajes flash de Laravel/Inertia para mostrarlos automáticamente.
 *
 * Puede colocarse en withApp (fuera del árbol de Inertia) porque
 * useFlashToast usa router.on('navigate') en lugar de usePage().
 */

import { Toast } from '@heroui/react';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { appToastQueue } from '@/lib/app-toast-queue';

export function AppToastProvider() {
    useFlashToast();

    return (
        <Toast.Provider
            queue={appToastQueue}
            placement="top end"
            maxVisibleToasts={5}
            gap={8}
        />
    );
}
