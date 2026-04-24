import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full ring-2 ring-blue-100">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback
                    className="rounded-full text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #38bdf8)' }}
                >
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-slate-800">{user.name}</span>
                {showEmail && (
                    <span className="truncate text-xs text-slate-400">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
