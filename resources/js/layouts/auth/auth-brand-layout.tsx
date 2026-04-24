import { Link } from '@inertiajs/react';
import { PlatformFaviconHead } from '@/components/platform-favicon-head';
import { usePlatform } from '@/hooks/use-platform';
import { platformImgOnDarkClass } from '@/lib/platform-media';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

const STATS = [
    { value: '500+', label: 'Cursos' },
    { value: '50k+', label: 'Estudiantes' },
    { value: '4.9★', label: 'Valoración' },
];

export default function AuthBrandLayout({ children, title, description, noCard = false }: AuthLayoutProps) {
    const platform = usePlatform();

    return (
        <div className="flex min-h-svh w-full">
            <PlatformFaviconHead />

            {/* ── Panel izquierdo — solo desktop ─────────────────────────── */}
            <aside className="relative hidden overflow-hidden lg:flex lg:w-[52%]">
                {/* Fondo */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(155deg,
                            oklch(0.14 0.09 272) 0%,
                            ${platform.login_bg_from} 40%,
                            ${platform.login_bg_to} 100%)`,
                    }}
                />
                {/* Dot grid */}
                <div
                    className="absolute inset-0 opacity-[0.055]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '30px 30px',
                    }}
                />
                {/* Glows */}
                <div
                    className="absolute -top-40 -right-40 size-[500px] rounded-full blur-[130px] opacity-25"
                    style={{ background: platform.color_accent }}
                />
                <div
                    className="absolute -bottom-32 -left-32 size-80 rounded-full blur-[90px] opacity-15"
                    style={{ background: platform.color_primary }}
                />

                <div className="relative z-10 flex flex-1 flex-col justify-between px-12 py-10">
                    {/* Logo */}
                    <Link href={home()} className="inline-block w-fit cursor-pointer">
                        <img
                            src={platform.logo_url}
                            alt={platform.app_name}
                            className={platformImgOnDarkClass(
                                platform.logo_url,
                                'h-20 object-contain object-left opacity-90',
                            )}
                        />
                    </Link>

                    {/* Centro visual */}
                    <div className="flex flex-col items-center gap-10 text-center">
                        {/* Orb con ícono */}
                        <div className="relative">
                            <div
                                className="absolute inset-0 scale-125 rounded-full blur-3xl opacity-35"
                                style={{ background: `radial-gradient(circle, ${platform.color_accent}, transparent 70%)` }}
                            />
                            <div className="relative size-44 rounded-full border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur-xl">
                                <div
                                    className="flex size-full items-center justify-center rounded-full"
                                    style={{ background: `radial-gradient(135deg at 30% 30%, ${platform.color_accent}33, ${platform.login_bg_from}aa)` }}
                                >
                                    <img
                                        src={platform.icon_url}
                                        alt={platform.app_name}
                                        className={platformImgOnDarkClass(platform.icon_url, 'size-20 object-contain')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tagline */}
                        <div className="max-w-sm space-y-3">
                            <h1 className="text-[2rem] font-bold leading-[1.2] tracking-tight text-white">
                                {platform.app_tagline ?? 'Aprende sin límites, crece sin fronteras.'}
                            </h1>
                            {platform.login_tagline && (
                                <p className="text-base leading-relaxed text-white/55">
                                    {platform.login_tagline}
                                </p>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3">
                            {STATS.map(({ value, label }) => (
                                <div
                                    key={label}
                                    className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/8 px-5 py-3 backdrop-blur-sm"
                                >
                                    <span className="text-xl font-bold text-white">{value}</span>
                                    <span className="mt-0.5 text-[0.7rem] text-white/50">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-xs text-white/30">
                        © {new Date().getFullYear()} {platform.app_name}. Todos los derechos reservados.
                    </p>
                </div>
            </aside>

            {/* ── Panel derecho — formulario ─────────────────────────────── */}
            <main
                className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-10 lg:px-16"
                style={{
                    background: `radial-gradient(ellipse 80% 60% at 50% 40%,
                        ${platform.color_primary}18 0%,
                        ${platform.color_accent}0d 40%,
                        oklch(0.97 0.008 262) 75%)`,
                    backgroundColor: 'oklch(0.97 0.008 262)',
                }}
            >
                {/* ── Fondo decorativo ──────────────────────────────────────── */}
                {/* Dot grid */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle, ${platform.color_primary}20 1.2px, transparent 1.2px)`,
                        backgroundSize: '26px 26px',
                    }}
                    aria-hidden
                />
                {/* Arco decorativo superior derecho */}
                <div
                    className="pointer-events-none absolute -top-32 -right-32 size-[380px] rounded-full border-[40px] opacity-[0.08]"
                    style={{ borderColor: platform.color_primary }}
                    aria-hidden
                />
                {/* Arco decorativo inferior izquierdo */}
                <div
                    className="pointer-events-none absolute -bottom-20 -left-20 size-[260px] rounded-full border-[28px] opacity-[0.06]"
                    style={{ borderColor: platform.color_accent }}
                    aria-hidden
                />
                {/* Glow central */}
                <div
                    className="pointer-events-none absolute left-1/2 top-1/2 size-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px] opacity-30"
                    style={{ background: `radial-gradient(circle, ${platform.color_primary}30, transparent 70%)` }}
                    aria-hidden
                />

                {/* ── Card ────────────────────────────────────────────────────── */}
                {noCard ? (
                    /* Modo noCard: children ES la card completa (ej: FlipAuthCard) */
                    <div className="relative z-10 w-full max-w-[420px]">
                        {children}
                    </div>
                ) : (
                    /* Modo normal: layout renderiza la card */
                    <div className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-2xl shadow-2xl shadow-black/[0.12]">
                        {/* Cabecera con gradiente de marca */}
                        <div
                            className="relative overflow-hidden px-8 pb-10 pt-8"
                            style={{
                                background: `linear-gradient(135deg, ${platform.login_bg_from} 0%, ${platform.login_bg_to} 60%, ${platform.color_accent} 100%)`,
                            }}
                        >
                            <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-white opacity-[0.06] blur-xl" aria-hidden />
                            <div className="pointer-events-none absolute -bottom-8 -left-8 size-24 rounded-full bg-white opacity-[0.05] blur-lg" aria-hidden />
                            <Link href={home()} className="mb-5 flex items-center gap-2.5 lg:hidden">
                                <img
                                    src={platform.icon_url}
                                    alt={platform.app_name}
                                    className={platformImgOnDarkClass(platform.icon_url, 'size-8 object-contain')}
                                />
                                <span className="font-semibold text-white/90">{platform.app_name}</span>
                            </Link>
                            <div className="hidden size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm lg:flex">
                                <img
                                    src={platform.icon_url}
                                    alt={platform.app_name}
                                    className={platformImgOnDarkClass(platform.icon_url, 'size-6 object-contain')}
                                />
                            </div>
                            {title && <h2 className="mt-4 text-[1.65rem] font-bold tracking-tight text-white">{title}</h2>}
                            {description && <p className="mt-1.5 text-[0.875rem] leading-relaxed text-white/60">{description}</p>}
                        </div>
                        <div className="-mt-5 rounded-t-2xl px-8 pb-8 pt-7 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
                            style={{ background: '#ffffff', color: '#0f172a' }}>
                            {children}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
