import { ToastQueue } from '@heroui/react';
import { flushSync } from 'react-dom';

/**
 * Cola de toasts sin `document.startViewTransition`.
 * El valor por defecto de HeroUI hace startViewTransition + flushSync; Inertia hace flushSync
 * al intercambiar la página tras un POST, y Chrome lanza:
 * InvalidStateError: Transition was aborted because of invalid state.
 */
export const appToastQueue = new ToastQueue({
    maxVisibleToasts: 5,
    wrapUpdate: (fn) => {
        flushSync(fn);
    },
});
