import { Link, usePage } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as adminNotificationsRoute from '@/routes/admin/notifications';

interface BellNotificationItem {
    id: string;
    title: string;
    body: string;
    action_url: string | null;
    read_at: string | null;
    created_at: string | null;
}

interface BellSharedProps {
    notificationsBell?: {
        unread_count: number;
        recent: BellNotificationItem[];
    };
}

export function NotificationBellMenu({
    buttonClassName,
    iconClassName = 'size-4',
}: {
    buttonClassName?: string;
    iconClassName?: string;
}) {
    const { notificationsBell } = usePage<BellSharedProps>().props;
    const unreadCount = notificationsBell?.unread_count ?? 0;
    const recent = notificationsBell?.recent ?? [];
    const hasUnread = unreadCount > 0;

    const badgeLabel = useMemo(() => {
        if (unreadCount > 9) {
            return '9+';
        }

        return `${unreadCount}`;
    }, [unreadCount]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={buttonClassName}
                    title="Notificaciones"
                >
                    <Bell className={iconClassName} />
                    {hasUnread ? (
                        <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                            {badgeLabel}
                        </span>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[360px] max-w-[92vw] rounded-xl p-0">
                <div className="flex items-center justify-between px-3 py-2">
                    <DropdownMenuLabel className="p-0 text-sm">Notificaciones</DropdownMenuLabel>
                    <Link
                        href={adminNotificationsRoute.index.url()}
                        className="text-xs font-semibold text-blue-700 hover:underline"
                    >
                        Ver todas
                    </Link>
                </div>
                <DropdownMenuSeparator />
                {recent.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-slate-500">
                        No tienes notificaciones recientes.
                    </div>
                ) : (
                    <div className="max-h-[360px] overflow-y-auto">
                        {recent.map((row) => (
                            <Link
                                key={row.id}
                                href={row.action_url || adminNotificationsRoute.index.url()}
                                className="block border-b border-slate-100 px-3 py-2.5 last:border-b-0 hover:bg-slate-50"
                            >
                                <div className="mb-1 flex items-start justify-between gap-2">
                                    <p className="line-clamp-1 text-sm font-semibold text-slate-800">{row.title}</p>
                                    {!row.read_at ? <CheckCheck className="mt-0.5 size-3.5 text-blue-500" /> : null}
                                </div>
                                <p className="line-clamp-2 text-xs text-slate-600">{row.body}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
