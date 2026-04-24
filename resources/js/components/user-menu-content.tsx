import { Link, router } from '@inertiajs/react';
import { LogOut, User } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User as UserType } from '@/types';

type Props = {
    user: UserType;
    /** Destino de «Mi perfil» (p. ej. /perfil en marketplace). Por defecto: ajustes del panel. */
    profileHref?: string;
};

export function UserMenuContent({ user, profileHref }: Props) {
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                        href={profileHref ?? edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <User className="size-4 text-slate-400" />
                        Mi perfil
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="size-4" />
                    Cerrar sesión
                </Link>
            </DropdownMenuItem>
        </>
    );
}
