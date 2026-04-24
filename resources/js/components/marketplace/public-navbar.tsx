import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Bell,
    BookOpen,
    Grid3x3,
    LogIn,
    Menu,
    Search,
    ShoppingCart,
    Sparkles,
    X,
} from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { LearningNavDropdown } from '@/components/marketplace/learning-nav-dropdown';
import { MobileMenuAnimStack } from '@/components/mobile-menu-anim-stack';
import { UserMenuContent } from '@/components/user-menu-content';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { home, login, register } from '@/routes';
import { account as profileAccount } from '@/routes/profile';
import cart from '@/routes/cart';
import learning from '@/routes/learning';
import notifications from '@/routes/notifications';
import type { PlatformSettings } from '@/types/platform';
import type { User } from '@/types';

const BADGE = 'bg-violet-600';

type PublicNavbarProps = {
    platform: PlatformSettings;
    canRegister: boolean;
    /** Texto actual de búsqueda (sincronizado con el catálogo) */
    searchQuery: string;
    onSearch: (query: string) => void;
    /** Contadores opcionales para badges (0 = oculto) */
    cartCount?: number;
    unreadNotifications?: number;
};

function IconNavLink({
    href,
    label,
    children,
    showDot,
}: {
    href: string;
    label: string;
    children: ReactNode;
    showDot?: boolean;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Link
                    href={href}
                    className={cn(
                        'relative inline-flex size-10 items-center justify-center rounded-xl text-slate-500',
                        'transition-all duration-200 ease-out',
                        'hover:-translate-y-px hover:bg-[color-mix(in_srgb,var(--brand)_6%,white)] hover:text-slate-900 hover:shadow-sm',
                        'active:translate-y-0 active:scale-[0.97]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand)_30%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                    )}
                >
                    <span className="sr-only">{label}</span>
                    {children}
                    {showDot ? (
                        <span
                            className={cn(
                                'pointer-events-none absolute right-1 top-1 size-2 rounded-full ring-2 ring-white',
                                BADGE,
                            )}
                            aria-hidden
                        />
                    ) : null}
                </Link>
            </TooltipTrigger>
            <TooltipContent
                side="bottom"
                sideOffset={6}
                className="border-0 bg-slate-900/95 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm"
            >
                {label}
            </TooltipContent>
        </Tooltip>
    );
}

export function PublicNavbar({
    platform,
    canRegister,
    searchQuery,
    onSearch,
    cartCount: cartCountProp,
    unreadNotifications = 0,
}: PublicNavbarProps) {
    const { auth, cartCount: sharedCartCount } = usePage<{
        auth: { user: User | null };
        cartCount?: number;
    }>().props;
    const cartCount = cartCountProp ?? sharedCartCount ?? 0;
    const user = auth.user;
    const getInitials = useInitials();

    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [draft, setDraft] = useState(searchQuery);
    const searchId = useId();
    const mobileMenuTitleId = useId();

    useEffect(() => {
        setDraft(searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 4);
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSearch(draft.trim());
        setMobileMenuOpen(false);
    };

    const learningHref = learning.index.url();
    const cartHref = cart.index.url();
    const notificationsHref = notifications.index.url();

    const showCartBadge = cartCount > 0;
    const showBellDot = unreadNotifications > 0;

    const brandStyles = {
        '--brand': platform.color_primary,
        '--brand-accent': platform.color_accent,
    } as CSSProperties;

    const brandGlowStyle = {
        background: `
            radial-gradient(120% 160% at 0% -20%, color-mix(in srgb, ${platform.color_primary} 14%, transparent), transparent 52%),
            radial-gradient(100% 140% at 100% 0%, color-mix(in srgb, ${platform.color_accent} 12%, transparent), transparent 48%)
        `,
    } as CSSProperties;

    return (
        <>
            <header
                className={cn(
                    'fixed inset-x-0 top-0 z-50 overflow-hidden transition-[box-shadow,background-color,border-color] duration-300',
                    'border-b border-transparent',
                    scrolled
                        ? 'border-slate-200/70 bg-white/95 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl backdrop-saturate-150'
                        : 'bg-white/85 backdrop-blur-lg',
                )}
                style={brandStyles}
            >
                <div
                    className={cn(
                        'pointer-events-none absolute inset-0 opacity-100 transition-opacity duration-300',
                        scrolled ? 'opacity-0' : 'opacity-100',
                    )}
                    style={brandGlowStyle}
                    aria-hidden
                />
                {/* Línea de acento sutil con color de marca */}
                <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-95"
                    style={{
                        background: `linear-gradient(90deg, transparent 0%, ${platform.color_primary} 35%, ${platform.color_accent} 65%, transparent 100%)`,
                    }}
                    aria-hidden
                />
                <div className="relative mx-auto flex min-h-14 max-w-7xl items-center gap-2 px-3 sm:min-h-16 sm:gap-3 sm:px-6 lg:gap-4 lg:px-8">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-5">
                        <Link
                            href={home.url()}
                            className="group flex min-w-0 shrink-0 items-center gap-2.5 rounded-xl py-1 pr-1 outline-none transition-[transform,opacity] duration-200 hover:opacity-95 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand)_35%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:gap-3"
                        >
                            <span
                                className={cn(
                                    'relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:size-10',
                                    'bg-gradient-to-br from-white to-slate-100/90 shadow-sm ring-1 ring-slate-200/60',
                                    'transition-[box-shadow,transform,ring-color] duration-200 group-hover:shadow-md group-hover:ring-[color-mix(in_srgb,var(--brand)_22%,transparent)]',
                                )}
                            >
                                <span
                                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                                    style={{
                                        background: `linear-gradient(135deg, color-mix(in srgb, ${platform.color_primary} 12%, transparent), color-mix(in srgb, ${platform.color_accent} 10%, transparent))`,
                                    }}
                                    aria-hidden
                                />
                                <img
                                    src={platform.icon_url}
                                    alt=""
                                    className="relative z-[1] size-[1.5rem] object-contain sm:size-[1.65rem]"
                                />
                            </span>
                            <span
                                className="min-w-0 max-w-[8.5rem] truncate text-[0.9375rem] font-bold tracking-tight sm:max-w-none sm:text-base"
                                style={{
                                    backgroundImage: `linear-gradient(135deg, ${platform.color_primary}, ${platform.color_accent})`,
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    color: 'transparent',
                                }}
                            >
                                {platform.app_name}
                            </span>
                        </Link>

                        <form
                            onSubmit={submitSearch}
                            className="hidden min-w-0 flex-1 md:flex md:max-w-xl lg:mx-0 lg:max-w-2xl xl:max-w-[min(42rem,100%)]"
                        >
                            <label htmlFor={searchId} className="sr-only">
                                Buscar cursos
                            </label>
                            <div
                                className={cn(
                                    'group/search flex w-full items-center gap-1.5 rounded-full bg-slate-100/75 px-1 py-1 pl-2 shadow-inner shadow-slate-200/25 ring-1 ring-slate-200/40',
                                    'transition-[background-color,box-shadow,ring-color] duration-200',
                                    'focus-within:bg-white focus-within:shadow-[0_0_0_1px_color-mix(in_srgb,var(--brand)_18%,transparent),0_12px_40px_-16px_rgba(15,23,42,0.18)] focus-within:ring-[color-mix(in_srgb,var(--brand)_22%,transparent)]',
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex size-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm ring-1 ring-slate-200/50 transition-all duration-200',
                                        'group-focus-within/search:text-[color:var(--brand)] group-focus-within/search:ring-[color-mix(in_srgb,var(--brand)_25%,transparent)]',
                                    )}
                                >
                                    <Search className="size-4" strokeWidth={2.25} aria-hidden />
                                </span>
                                <input
                                    id={searchId}
                                    type="search"
                                    value={draft}
                                    onChange={(event) => setDraft(event.target.value)}
                                    placeholder="Buscar cursos, tecnologías, instructores…"
                                    className="min-w-0 flex-1 border-0 bg-transparent py-2 text-[0.9375rem] leading-snug text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                                    autoComplete="off"
                                />
                                <button
                                    type="submit"
                                    className="hidden shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm ring-1 ring-white/25 transition-[filter,transform,box-shadow] hover:brightness-[1.06] active:scale-[0.98] sm:inline-flex"
                                    style={{
                                        background: `linear-gradient(135deg, ${platform.color_primary} 0%, ${platform.color_accent} 100%)`,
                                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 6px 20px -8px color-mix(in srgb, ${platform.color_primary} 55%, transparent)`,
                                    }}
                                >
                                    <Sparkles className="size-3.5 opacity-90" aria-hidden />
                                    Buscar
                                    <ArrowRight className="size-3.5 opacity-80" aria-hidden />
                                </button>
                            </div>
                        </form>
                    </div>

                    <div
                        className="mx-1 hidden h-9 w-px shrink-0 self-center rounded-full bg-gradient-to-b from-transparent via-slate-300/70 to-transparent lg:block"
                        aria-hidden
                    />

                    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 lg:pl-1 xl:pl-2">
                        <nav className="hidden shrink-0 items-center lg:flex" aria-label="Atajos">
                            <a
                                href={`${home.url()}#explorar`}
                                className={cn(
                                    'group/cat inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold text-slate-600',
                                    'bg-transparent transition-all duration-200',
                                    'hover:bg-[color-mix(in_srgb,var(--brand)_7%,white)] hover:text-slate-900 hover:shadow-sm',
                                )}
                            >
                                <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100/90 text-slate-500 transition-colors group-hover/cat:bg-white group-hover/cat:text-[color:var(--brand)]">
                                    <Grid3x3 className="size-4" strokeWidth={2} aria-hidden />
                                </span>
                                Explorar
                                <ArrowRight className="size-3.5 opacity-0 transition-all group-hover/cat:translate-x-0.5 group-hover/cat:opacity-60" aria-hidden />
                            </a>
                        </nav>

                        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                        {user ? (
                            <>
                                <LearningNavDropdown platform={platform} />

                                <div className="hidden items-center md:flex md:gap-0.5">
                                    <IconNavLink href={cartHref} label="Carrito" showDot={false}>
                                        <span className="relative inline-flex">
                                            <ShoppingCart className="size-[1.35rem] stroke-[1.75]" />
                                            {showCartBadge ? (
                                                <span
                                                    className={cn(
                                                        'absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-bold text-white ring-2 ring-white',
                                                        BADGE,
                                                    )}
                                                >
                                                    {cartCount > 9 ? '9+' : cartCount}
                                                </span>
                                            ) : null}
                                        </span>
                                    </IconNavLink>
                                    <IconNavLink
                                        href={notificationsHref}
                                        label="Notificaciones"
                                        showDot={showBellDot}
                                    >
                                        <Bell className="size-[1.35rem] stroke-[1.75]" />
                                    </IconNavLink>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className={cn(
                                                'size-10 shrink-0 rounded-lg p-0',
                                                'transition-colors hover:bg-slate-100/90',
                                            )}
                                            aria-label="Menú de cuenta"
                                        >
                                            <Avatar className="size-9 border border-slate-200/60 shadow-none sm:size-10">
                                                <AvatarImage src={user.avatar} alt={user.name} />
                                                <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-500 text-xs font-semibold text-white">
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="w-60 rounded-2xl border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md"
                                        align="end"
                                        sideOffset={10}
                                    >
                                        <UserMenuContent user={user} profileHref={profileAccount.url()} />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <>
                                <div className="hidden items-center md:flex md:gap-0.5">
                                    <IconNavLink href={cartHref} label="Carrito" showDot={false}>
                                        <span className="relative inline-flex">
                                            <ShoppingCart className="size-[1.35rem] stroke-[1.75]" />
                                            {showCartBadge ? (
                                                <span
                                                    className={cn(
                                                        'absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-bold text-white ring-2 ring-white',
                                                        BADGE,
                                                    )}
                                                >
                                                    {cartCount > 9 ? '9+' : cartCount}
                                                </span>
                                            ) : null}
                                        </span>
                                    </IconNavLink>
                                </div>
                                <Link
                                    href={login()}
                                    className={cn(
                                        'hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700',
                                        'shadow-sm transition-all hover:border-slate-300 hover:bg-white hover:text-slate-900 hover:shadow-md',
                                        'active:scale-[0.98] sm:inline-flex',
                                    )}
                                >
                                    <LogIn className="size-4 text-slate-400" strokeWidth={2} aria-hidden />
                                    Iniciar sesión
                                </Link>
                                {canRegister ? (
                                    <Link
                                        href={register()}
                                        className={cn(
                                            'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white',
                                            'shadow-md ring-1 ring-white/30 transition-[filter,transform,box-shadow] hover:brightness-[1.06] active:scale-[0.98]',
                                        )}
                                        style={{
                                            background: `linear-gradient(135deg, ${platform.color_primary} 0%, ${platform.color_accent} 100%)`,
                                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), 0 8px 24px -10px color-mix(in srgb, ${platform.color_primary} 50%, transparent)`,
                                        }}
                                    >
                                        <Sparkles className="size-4 opacity-90" aria-hidden />
                                        Registrarse
                                    </Link>
                                ) : null}
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen((open) => !open)}
                            className={cn(
                                'inline-flex size-10 items-center justify-center rounded-xl text-slate-600',
                                'transition-all hover:-translate-y-px hover:bg-slate-100/90 hover:text-slate-900 hover:shadow-sm active:translate-y-0 lg:hidden',
                            )}
                            aria-expanded={mobileMenuOpen}
                            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                        >
                            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </button>
                        </div>
                    </div>
                </div>
            </header>

            <MobileMenuAnimStack
                open={mobileMenuOpen}
                onRequestClose={() => setMobileMenuOpen(false)}
                panelClassName="fixed left-3 right-3 top-[calc(3.5rem+10px)] z-45 max-h-[min(calc(100dvh-5rem),88dvh)] overflow-y-auto overscroll-y-contain rounded-2xl border border-slate-200/60 bg-white p-0 pb-5 shadow-2xl shadow-slate-900/15 sm:left-4 sm:right-4 sm:top-[calc(4rem+12px)]"
                panelProps={{
                    role: 'dialog',
                    'aria-modal': true,
                    'aria-labelledby': mobileMenuTitleId,
                }}
            >
                        <div
                            className="relative overflow-hidden rounded-t-2xl px-4 pb-5 pt-4"
                            style={{
                                background: `linear-gradient(145deg, color-mix(in srgb, ${platform.color_primary} 10%, white) 0%, white 42%, color-mix(in srgb, ${platform.color_accent} 8%, white) 100%)`,
                            }}
                        >
                            <div
                                className="pointer-events-none absolute -right-16 -top-24 size-56 rounded-full opacity-40 blur-3xl"
                                style={{
                                    background: `radial-gradient(circle, color-mix(in srgb, ${platform.color_primary} 35%, transparent), transparent 70%)`,
                                }}
                                aria-hidden
                            />
                            <div className="pointer-events-none mx-auto mb-3 flex w-full max-w-12 justify-center" aria-hidden>
                                <span className="h-1 w-10 rounded-full bg-slate-900/15" />
                            </div>
                            <p
                                id={mobileMenuTitleId}
                                className="relative mb-1 text-center text-[0.65rem] font-bold uppercase tracking-[0.22em] text-slate-500"
                            >
                                Menú rápido
                            </p>
                            <p className="relative mb-1 text-center text-lg font-bold tracking-tight text-slate-900">
                                Explora el catálogo
                            </p>
                            <p className="relative mb-4 text-center text-xs text-slate-600">
                                Busca cursos y navega en segundos
                            </p>

                            <form onSubmit={submitSearch} className="relative">
                                <div className="flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-2 py-1 pl-3 shadow-md shadow-slate-900/8 ring-1 ring-slate-200/50 backdrop-blur-sm">
                                    <Search className="size-4 shrink-0 text-slate-400" aria-hidden />
                                    <input
                                        type="search"
                                        value={draft}
                                        onChange={(event) => setDraft(event.target.value)}
                                        placeholder="¿Qué quieres aprender?"
                                        className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-[0.65rem] font-bold uppercase tracking-wide text-white"
                                        style={{
                                            background: `linear-gradient(135deg, ${platform.color_primary} 0%, ${platform.color_accent} 100%)`,
                                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2)`,
                                        }}
                                    >
                                        Buscar
                                        <ArrowRight className="size-3.5 opacity-90" aria-hidden />
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="px-4 pb-4 pt-2">
                            <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                                Navegación
                            </p>
                            <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/50 bg-slate-50/40 shadow-inner shadow-slate-200/20">
                            <a
                                href={`${home.url()}#explorar`}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-3 text-sm font-medium text-slate-800',
                                    'transition-colors hover:bg-white active:bg-white',
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Grid3x3 className="size-5 shrink-0 text-slate-500" aria-hidden />
                                Explorar cursos
                            </a>

                            {user ? (
                                <>
                                    <div className="mx-3 h-px bg-slate-200/80" aria-hidden />
                                    <Link
                                        href={learningHref}
                                        className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-white"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <BookOpen className="size-4 text-slate-500" strokeWidth={2} aria-hidden />
                                        Mi aprendizaje
                                    </Link>
                                    <Link
                                        href={cartHref}
                                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-white"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <ShoppingCart className="size-5 shrink-0 text-slate-400" strokeWidth={2} aria-hidden />
                                        Carrito
                                    </Link>
                                    <Link
                                        href={notificationsHref}
                                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-white"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Bell className="size-5 shrink-0 text-slate-400" strokeWidth={2} aria-hidden />
                                        Notificaciones
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <div className="mx-3 h-px bg-slate-200/80" aria-hidden />
                                    <Link
                                        href={cartHref}
                                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-white"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <span className="relative inline-flex shrink-0">
                                            <ShoppingCart className="size-5 text-slate-400" strokeWidth={2} aria-hidden />
                                            {showCartBadge ? (
                                                <span
                                                    className={cn(
                                                        'absolute -right-1.5 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-bold text-white',
                                                        BADGE,
                                                    )}
                                                >
                                                    {cartCount > 9 ? '9+' : cartCount}
                                                </span>
                                            ) : null}
                                        </span>
                                        <span className="min-w-0 flex-1">Carrito</span>
                                    </Link>
                                    <div className="mx-3 h-px bg-slate-200/80" aria-hidden />
                                    <Link
                                        href={login()}
                                        className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-white"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <LogIn className="size-4 text-slate-400" strokeWidth={2} aria-hidden />
                                        Iniciar sesión
                                    </Link>
                                    {canRegister ? (
                                        <Link
                                            href={register()}
                                            className="mx-3 mb-3 mt-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md ring-1 ring-white/25 transition-[filter,transform] hover:brightness-[1.06] active:scale-[0.99]"
                                            style={{
                                                background: `linear-gradient(135deg, ${platform.color_primary} 0%, ${platform.color_accent} 100%)`,
                                                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 10px 28px -14px color-mix(in srgb, ${platform.color_primary} 45%, transparent)`,
                                            }}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <Sparkles className="size-4 opacity-90" aria-hidden />
                                            Registrarse
                                        </Link>
                                    ) : null}
                                </>
                            )}
                            </div>
                        </div>
            </MobileMenuAnimStack>

            <div className="h-14 shrink-0 sm:h-16" aria-hidden />
        </>
    );
}
