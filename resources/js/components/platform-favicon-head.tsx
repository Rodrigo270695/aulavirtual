import { Head, usePage } from '@inertiajs/react';
import { faviconLinkType } from '@/lib/platform-media';
import type { PlatformSettings } from '@/types/platform';

/**
 * Sincroniza favicon / apple-touch-icon con `platform` compartido (Inertia),
 * para que al cambiar marca en admin se actualice sin recarga completa.
 */
export function PlatformFaviconHead() {
    const platform = usePage().props.platform as PlatformSettings | undefined;
    const href = platform?.favicon_url;
    if (!href) {
        return null;
    }

    return (
        <Head>
            <link key="platform-favicon" rel="icon" href={href} type={faviconLinkType(href)} />
            <link key="platform-apple-touch" rel="apple-touch-icon" href={href} />
        </Head>
    );
}
