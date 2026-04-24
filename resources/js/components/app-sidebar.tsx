import { Link } from '@inertiajs/react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavSection } from '@/components/nav-group';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { sidebarSections, topNavItems } from '@/constants/sidebar-nav';
import { usePlatform } from '@/hooks/use-platform';
import { platformImgOnDarkClass } from '@/lib/platform-media';
import { dashboard } from '@/routes';

export function AppSidebar() {
    const { icon_url, app_name } = usePlatform();

    return (
        <Sidebar collapsible="icon" variant="inset">

            {/* ── Logo / Header ─────────────────────────────────────── */}
            <SidebarHeader
                style={{
                    background: 'linear-gradient(160deg, #eef2ff 0%, #dbeafe 100%)',
                    padding: '0',
                    borderBottom: '2px solid #93c5fd',
                    boxShadow: '0 1px 6px 0 rgba(59,130,246,0.10)',
                }}
            >
                <SidebarMenu>
                    <SidebarMenuItem>
                        {/*
                         * Usamos un Link directo (sin SidebarMenuButton) para evitar
                         * que collapsible="icon" fuerce size-8 / p-2 sobre el contenedor,
                         * lo que recortaba el ícono al colapsar el sidebar.
                         */}
                        <Link
                            href={dashboard()}
                            prefetch
                            className="flex w-full items-center gap-3 rounded-none px-3 py-3.5 transition-colors
                                       hover:bg-blue-100/70 active:bg-blue-200/50
                                       group-data-[collapsible=icon]:justify-center
                                       group-data-[collapsible=icon]:gap-0
                                       group-data-[collapsible=icon]:px-0
                                       group-data-[collapsible=icon]:py-2.5"
                        >
                            {/* Ícono en contenedor con gradiente — siempre visible */}
                            <div
                                className="flex size-8 shrink-0 items-center justify-center rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                                    boxShadow: '0 2px 8px rgba(29,78,216,0.28)',
                                }}
                            >
                                <img
                                    src={icon_url}
                                    alt={app_name}
                                    className={platformImgOnDarkClass(icon_url, 'size-[18px] object-contain')}
                                />
                            </div>

                            {/* Texto — se oculta al colapsar */}
                            <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                                <span className="truncate text-[13px] font-bold leading-tight text-blue-900">
                                    Campus Virtual
                                </span>
                                <span className="truncate text-[10.5px] font-medium leading-tight text-blue-500">
                                    {app_name}
                                </span>
                            </div>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* ── Navegación principal ──────────────────────────────── */}
            <SidebarContent className="overflow-x-hidden pt-2">
                <NavMain items={topNavItems} />
                {sidebarSections.map((section) => (
                    <NavSection key={section.label} section={section} />
                ))}
            </SidebarContent>

            {/* ── Footer ────────────────────────────────────────────── */}
            <SidebarFooter className="border-t border-sidebar-border/60 p-2">
                <NavFooter items={[]} className="mt-auto" />
                <NavUser />
            </SidebarFooter>

        </Sidebar>
    );
}
