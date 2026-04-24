import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { usePermissions } from '@/hooks/use-permissions';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const permissions = usePermissions();

    // Filtrar ítems que requieren permiso que el usuario no posee
    const visibleItems = items.filter(
        (item) => !item.permission || permissions.includes(item.permission),
    );

    if (!visibleItems.length) return null;

    return (
        <SidebarGroup className="px-2 py-1">
            <SidebarMenu>
                {visibleItems.map((item) => {
                    const active = isCurrentUrl(item.href);
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className={cn(
                                    'relative h-9 rounded-lg transition-all duration-150',
                                    active
                                        ? 'bg-blue-50 font-semibold text-blue-700 shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
                                )}
                                style={active ? {
                                    background: 'linear-gradient(90deg, #eff6ff 0%, #f0f9ff 100%)',
                                    color: '#1d4ed8',
                                } : undefined}
                            >
                                <Link href={item.href} prefetch>
                                    {/* Indicador activo lateral */}
                                    {active && (
                                        <span
                                            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full"
                                            style={{ background: 'linear-gradient(180deg, #1d4ed8, #38bdf8)' }}
                                        />
                                    )}
                                    {item.icon && (
                                        <item.icon className={cn(
                                            'size-4 shrink-0 transition-all duration-150',
                                            active ? 'text-blue-600' : 'opacity-60',
                                        )} />
                                    )}
                                    <span className="min-w-0 truncate">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
