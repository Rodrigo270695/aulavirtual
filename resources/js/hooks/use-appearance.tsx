/**
 * La plataforma solo soporta modo claro.
 * Este hook es un stub que siempre devuelve 'light' para mantener
 * la compatibilidad con cualquier componente que lo importe.
 */

export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

/** Aplica siempre el modo claro y borra cualquier cookie/localStorage previo de dark mode */
export function initializeTheme(): void {
    if (typeof document === 'undefined') return;

    // Eliminar clase dark si existe (por algún valor residual)
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';

    // Borrar preferencia guardada para no conservar dark mode de sesiones previas
    try {
        localStorage.removeItem('appearance');
    } catch {
        // ignore
    }
}

export function useAppearance(): UseAppearanceReturn {
    return {
        appearance: 'light',
        resolvedAppearance: 'light',
        updateAppearance: () => {
            // No-op: modo oscuro no disponible
        },
    } as const;
}
