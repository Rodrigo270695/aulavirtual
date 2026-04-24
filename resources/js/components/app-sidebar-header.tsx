import { router, usePage } from '@inertiajs/react';
import { CornerDownLeft, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NotificationBellMenu } from '@/components/notifications/notification-bell-menu';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Modal } from '@/components/ui/modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useInitials } from '@/hooks/use-initials';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage().props;
    const getInitials = useInitials();
    const [searchOpen, setSearchOpen] = useState(false);

    const quickSearchItems = useMemo(
        () => [
            { label: 'Dashboard', hint: 'Resumen ejecutivo', href: '/dashboard', group: 'Principal' },
            { label: 'Usuarios', hint: 'Gestión de usuarios', href: '/admin/users', group: 'Administración' },
            { label: 'Roles', hint: 'Roles y permisos', href: '/admin/roles', group: 'Administración' },
            { label: 'Cursos', hint: 'Catálogo de cursos', href: '/admin/courses', group: 'Administración' },
            { label: 'Órdenes', hint: 'Comercio y ventas', href: '/admin/orders', group: 'Comercio' },
            { label: 'Pagos', hint: 'Pagos registrados', href: '/admin/payments', group: 'Comercio' },
            { label: 'Reembolsos', hint: 'Solicitudes de reembolso', href: '/admin/refunds', group: 'Comercio' },
            { label: 'Notificaciones', hint: 'Centro de notificaciones', href: '/admin/notifications', group: 'Sistema' },
            { label: 'Auditoría', hint: 'Actividad e inicios de sesión', href: '/admin/audit', group: 'Sistema' },
            { label: 'Plataforma', hint: 'Marca y paleta', href: '/admin/platform-settings', group: 'Configuración' },
            { label: 'General', hint: 'Contacto y enlaces legales', href: '/admin/general-settings', group: 'Configuración' },
        ],
        [],
    );
    const quickSearchGroups = useMemo(() => {
        return quickSearchItems.reduce<Record<string, typeof quickSearchItems>>((acc, item) => {
            if (!acc[item.group]) acc[item.group] = [];
            acc[item.group].push(item);
            return acc;
        }, {});
    }, [quickSearchItems]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setSearchOpen((value) => ! value);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/95 px-4 shadow-sm backdrop-blur-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            {/* ── Izquierda: toggle + breadcrumbs ── */}
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700" />
                {breadcrumbs.length > 0 && (
                    <div className="flex items-center">
                        <span className="mx-2 text-slate-300">|</span>
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                )}
            </div>

            {/* ── Derecha: búsqueda + notificaciones + avatar ── */}
            <div className="flex items-center gap-1.5">
                {/* Búsqueda */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    title="Buscar"
                    onClick={() => setSearchOpen(true)}
                >
                    <Search className="size-4" />
                </Button>

                <NotificationBellMenu buttonClassName="relative h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700" />

                {/* Separador */}
                <div className="mx-1 h-5 w-px bg-slate-200" />

                {/* Avatar del usuario */}
                {auth?.user && (
                    <Avatar className="h-7 w-7 cursor-pointer ring-2 ring-blue-100 ring-offset-1 transition-all hover:ring-blue-300">
                        <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                        <AvatarFallback
                            className="rounded-full text-[10px] font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg, #1d4ed8, #38bdf8)' }}
                        >
                            {getInitials(auth.user.name)}
                        </AvatarFallback>
                    </Avatar>
                )}
            </div>
            <Modal
                open={searchOpen}
                onClose={() => setSearchOpen(false)}
                title="Búsqueda rápida"
                description={
                    <span className="inline-flex items-center gap-2">
                        Navega por secciones del panel.
                        <span className="rounded-md border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                            Ctrl/Cmd + K
                        </span>
                    </span>
                }
                size="xl"
                footer={
                    <div className="flex w-full items-center justify-between text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                            <CornerDownLeft className="size-3.5" />
                            Enter para abrir
                        </span>
                        <span>Esc para cerrar</span>
                    </div>
                }
            >
                <Command>
                    <CommandInput placeholder="Buscar sección, módulo o pantalla..." autoFocus />
                    <CommandList>
                        <CommandEmpty>No se encontraron coincidencias.</CommandEmpty>
                        {Object.entries(quickSearchGroups).map(([group, items]) => (
                            <CommandGroup key={group} heading={group}>
                                {items.map((item) => (
                                    <CommandItem
                                        key={item.href}
                                        value={`${item.label} ${item.hint}`}
                                        onSelect={() => {
                                            setSearchOpen(false);
                                            router.visit(item.href);
                                        }}
                                    >
                                        <div className="flex min-w-0 flex-col">
                                            <span className="truncate font-medium">{item.label}</span>
                                            <span className="truncate text-xs text-slate-500">{item.hint}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </Modal>
        </header>
    );
}
