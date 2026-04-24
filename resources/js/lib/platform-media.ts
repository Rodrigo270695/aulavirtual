import { cn } from '@/lib/utils';

/**
 * Los assets en /public/logo son siluetas oscuras; en paneles oscuros se invierten a blanco.
 * Las marcas subidas viven bajo /storage/ y deben mostrarse a color.
 */
export function platformMonochromeOnDarkClass(url: string): string {
    if (!url || url.includes('/storage/')) {
        return '';
    }
    return 'brightness-0 invert';
}

export function platformImgOnDarkClass(url: string, ...rest: string[]): string {
    return cn(...rest, platformMonochromeOnDarkClass(url));
}

/** `type` del `<link rel="icon">` según extensión (favicon en Blade / Inertia Head). */
export function faviconLinkType(url: string): string {
    const path = url.split('?')[0].toLowerCase();
    if (path.endsWith('.ico')) {
        return 'image/x-icon';
    }
    if (path.endsWith('.svg')) {
        return 'image/svg+xml';
    }
    if (path.endsWith('.webp')) {
        return 'image/webp';
    }
    if (path.endsWith('.gif')) {
        return 'image/gif';
    }
    return 'image/png';
}
