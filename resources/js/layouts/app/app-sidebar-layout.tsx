import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { PlatformFaviconHead } from '@/components/platform-favicon-head';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <>
            <PlatformFaviconHead />
            <AppShell variant="sidebar">
                <AppSidebar />
                <AppContent variant="sidebar" className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
                        {children}
                    </div>
                </AppContent>
            </AppShell>
        </>
    );
}
