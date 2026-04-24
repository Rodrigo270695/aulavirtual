import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/use-permissions';
import type { NavGroup as NavGroupType, NavSection } from '@/types';

// ─── NavGroupItem ─────────────────────────────────────────────────────────────

function NavGroupItem({ group }: { group: NavGroupType }) {
    const { url } = usePage();
    const permissions = usePermissions();

    // Filtrar sub-ítems por permiso
    const visibleItems = group.items.filter(
        (item) => !item.permission || permissions.includes(item.permission),
    );

    if (visibleItems.length === 0) {
        return null;
    }

    const isAnyChildActive = visibleItems.some(
        (item) => item.href !== '#' && url.startsWith(item.href),
    );

    const [open, setOpen] = useState(isAnyChildActive);

    useEffect(() => {
        if (isAnyChildActive) setOpen(true);
    }, [isAnyChildActive]);

    return (
        <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
            <SidebarMenuItem>

                {/* ── Trigger ─────────────────────────────────────── */}
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        tooltip={group.title}
                        isActive={isAnyChildActive}
                        className={cn(
                            'relative h-8 cursor-pointer rounded-lg transition-all duration-150',
                            isAnyChildActive
                                ? 'bg-blue-50 font-semibold text-blue-700'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
                        )}
                        style={isAnyChildActive ? {
                            background: 'linear-gradient(90deg, #eff6ff 0%, #f0f9ff 100%)',
                            color: '#1d4ed8',
                        } : undefined}
                    >
                        {/* Indicador activo lateral */}
                        {isAnyChildActive && (
                            <span
                                className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full"
                                style={{ background: 'linear-gradient(180deg, #1d4ed8, #38bdf8)' }}
                            />
                        )}
                        {group.icon && (
                            <group.icon className={cn(
                                'size-4 shrink-0 transition-all duration-150',
                                isAnyChildActive ? 'text-blue-600' : 'opacity-55 group-hover/menu-button:opacity-80',
                            )} />
                        )}
                        <span className="min-w-0 flex-1 truncate text-[13px]">{group.title}</span>
                        <ChevronRight className={cn(
                            'ml-auto size-3.5 shrink-0 transition-transform duration-200 ease-out',
                            'group-data-[state=open]/collapsible:rotate-90',
                            isAnyChildActive ? 'text-blue-500' : 'text-slate-400',
                        )} />
                    </SidebarMenuButton>
                </CollapsibleTrigger>

                {/* ── Sub-items ────────────────────────────────────── */}
                <CollapsibleContent>
                    <SidebarMenuSub className="my-0.5 border-l border-slate-200 ml-3">
                        {visibleItems.map((item) => {
                            const isActive =
                                item.href !== '#' && url.startsWith(item.href);

                            return (
                                <SidebarMenuSubItem key={item.title}>
                                    <SidebarMenuSubButton
                                        asChild
                                        isActive={isActive}
                                        className={cn(
                                            'h-7 rounded-md pl-3 text-[12.5px] transition-all duration-150',
                                            item.disabled
                                                ? 'pointer-events-none opacity-35'
                                                : isActive
                                                    ? 'font-medium text-blue-700'
                                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
                                        )}
                                    >
                                        <Link
                                            href={item.disabled ? '#' : item.href}
                                            prefetch={!item.disabled}
                                        >
                                            {item.icon && (
                                                <item.icon className={cn(
                                                    'size-3 shrink-0',
                                                    isActive ? 'text-blue-500' : 'opacity-50',
                                                )} />
                                            )}
                                            <span className="min-w-0 truncate">{item.title}</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            );
                        })}
                    </SidebarMenuSub>
                </CollapsibleContent>

            </SidebarMenuItem>
        </Collapsible>
    );
}

// ─── NavSection ───────────────────────────────────────────────────────────────

export function NavSection({ section }: { section: NavSection }) {
    const permissions = usePermissions();

    if (!section.groups?.length) return null;

    // Filtrar grupos cuyo permiso de acceso (*.view) el usuario no posee
    const visibleGroups = section.groups.filter(
        (group) => !group.permission || permissions.includes(group.permission),
    );

    // Si ningún grupo es visible, ocultar la sección completa (módulo)
    if (!visibleGroups.length) return null;

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="mb-0.5 mt-1 h-5 select-none text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {section.label}
            </SidebarGroupLabel>

            <SidebarMenu className="gap-0.5">
                {visibleGroups.map((group) => (
                    <NavGroupItem key={group.title} group={group} />
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
