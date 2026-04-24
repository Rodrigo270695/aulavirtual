import { Link } from '@inertiajs/react';
import { home, login, register } from '@/routes';
import type { PlatformSettings } from '@/types/platform';

type LandingNavbarProps = {
    platform: PlatformSettings;
    canRegister: boolean;
};

export function LandingNavbar({ platform, canRegister }: LandingNavbarProps) {
    return (
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                <Link href={home()} className="flex items-center gap-2.5">
                    <img
                        src={platform.icon_url}
                        alt={platform.app_name}
                        className="size-8 object-contain"
                    />
                    <span className="text-base font-bold text-slate-900">{platform.app_name}</span>
                </Link>

                <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
                    <a href="#cursos" className="transition-colors hover:text-slate-900">
                        Cursos
                    </a>
                    <a href="#categorias" className="transition-colors hover:text-slate-900">
                        Categorias
                    </a>
                    <a href="#testimonios" className="transition-colors hover:text-slate-900">
                        Opiniones
                    </a>
                </nav>

                <div className="flex items-center gap-3">
                    <Link
                        href={login()}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                    >
                        Iniciar sesion
                    </Link>
                    {canRegister && (
                        <Link
                            href={register()}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md"
                            style={{ background: `linear-gradient(135deg, ${platform.color_primary} 0%, ${platform.color_accent} 100%)` }}
                        >
                            Registrarse
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
