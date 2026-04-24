import { usePage } from '@inertiajs/react';

interface AuthProps {
    auth: {
        user: Record<string, unknown> | null;
        permissions: string[];
    };
}

/** Devuelve la lista de permisos del usuario autenticado. */
export function usePermissions(): string[] {
    const { auth } = usePage<AuthProps>().props;
    return auth?.permissions ?? [];
}

/** Devuelve true si el usuario tiene el permiso indicado. */
export function useCan(permission: string): boolean {
    return usePermissions().includes(permission);
}
