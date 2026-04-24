import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

/** Tras OAuth en popup: el servidor envía ruta relativa; si llegara URL absoluta, solo usamos path en el origen actual. */
export function oauthPostLoginPath(redirectTo: string | undefined, fallback = '/dashboard'): string {
    const raw = redirectTo ?? fallback;
    try {
        const u = new URL(raw, window.location.origin);
        return u.pathname + u.search + u.hash;
    } catch {
        return fallback;
    }
}
