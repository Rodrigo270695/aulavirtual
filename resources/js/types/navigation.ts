import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

/** Ítem de navegación simple (sin hijos) */
export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    /** Permiso de Spatie requerido para ver este ítem */
    permission?: string;
    /** Deshabilitado visualmente (ruta aún no implementada) */
    disabled?: boolean;
};

/** Ítem secundario dentro de un grupo colapsable */
export type NavSubItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    permission?: string;
    disabled?: boolean;
};

/** Grupo colapsable con sub-ítems (sección desplegable del menú) */
export type NavGroup = {
    title: string;
    icon?: LucideIcon | null;
    /** Permiso mínimo para ver el grupo completo */
    permission?: string;
    items: NavSubItem[];
};

/** Sección del sidebar que agrupa varios NavGroup o NavItem bajo una etiqueta */
export type NavSection = {
    label: string;
    /** Grupos colapsables dentro de esta sección */
    groups?: NavGroup[];
    /** Ítems simples (sin hijos) dentro de esta sección */
    items?: NavItem[];
};
