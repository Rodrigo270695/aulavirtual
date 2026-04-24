import { Head, router, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { PublicNavbar } from '@/components/marketplace/public-navbar';
import { PlatformFaviconHead } from '@/components/platform-favicon-head';
import { usePlatform } from '@/hooks/use-platform';
import { home } from '@/routes';

type MarketplaceShellProps = {
    title: string;
    children: ReactNode;
};

export function MarketplaceShell({ title, children }: MarketplaceShellProps) {
    const platform = usePlatform();
    const { canRegister, notificationsBell } = usePage<{
        canRegister?: boolean;
        notificationsBell?: { unread_count: number };
    }>().props;

    return (
        <>
            <Head title={title} />
            <PlatformFaviconHead />
            <div className="min-h-screen bg-[#f4f7fb] text-slate-900 antialiased">
                <PublicNavbar
                    platform={platform}
                    canRegister={canRegister ?? true}
                    unreadNotifications={notificationsBell?.unread_count ?? 0}
                    searchQuery=""
                    onSearch={(q) =>
                        router.get(
                            home.url(),
                            { q, sort: 'popular' },
                            { preserveState: true, replace: true },
                        )
                    }
                />
                {children}
            </div>
        </>
    );
}
