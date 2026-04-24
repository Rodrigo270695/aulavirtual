import { ArrowRight, Award, Clock, PlayCircle, Search, Sparkles, TrendingUp, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import type { PlatformSettings } from '@/types/platform';
import { cn } from '@/lib/utils';

type PublicHeroProps = {
    platform: PlatformSettings;
    initialQuery: string;
    onSearch: (query: string) => void;
};

const learnerBenefits = [
    {
        icon: Clock,
        title: 'Horario flexible',
        text: 'Sin fechas fijas: avanza lección a lección.',
    },
    {
        icon: TrendingUp,
        title: 'Progreso visible',
        text: 'Módulos y metas claras desde el primer día.',
    },
    {
        icon: Users,
        title: 'Instructores reales',
        text: 'Trayectoria visible en cada ficha del catálogo.',
    },
] as const;

function accentSpan(platform: PlatformSettings, children: ReactNode) {
    return (
        <span
            className="bg-clip-text text-transparent"
            style={{
                backgroundImage: `linear-gradient(120deg, ${platform.color_primary}, ${platform.color_accent})`,
            }}
        >
            {children}
        </span>
    );
}

export function PublicHero({ platform, initialQuery, onSearch }: PublicHeroProps) {
    const [query, setQuery] = useState(initialQuery);
    const sectionRef = useRef<HTMLElement>(null);
    const benefitsRef = useRef<HTMLDivElement>(null);
    const rafPendingRef = useRef<number | null>(null);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    const [shiftPx, setShiftPx] = useState(0);
    const [benefitsRevealed, setBenefitsRevealed] = useState(prefersReducedMotion);

    useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => {
            const next = mq.matches;
            setPrefersReducedMotion(next);
            if (next) {
                setShiftPx(0);
                setBenefitsRevealed(true);
            }
        };
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);

    useEffect(() => {
        if (prefersReducedMotion) {
            setShiftPx(0);
            return;
        }

        const tick = () => {
            const el = sectionRef.current;
            if (!el) {
                return;
            }
            const rect = el.getBoundingClientRect();
            const raw = -rect.top * 0.1;
            setShiftPx(Math.max(-26, Math.min(26, raw)));
        };

        const onScroll = () => {
            if (rafPendingRef.current !== null) {
                return;
            }
            rafPendingRef.current = requestAnimationFrame(() => {
                rafPendingRef.current = null;
                tick();
            });
        };

        tick();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (rafPendingRef.current !== null) {
                cancelAnimationFrame(rafPendingRef.current);
                rafPendingRef.current = null;
            }
        };
    }, [prefersReducedMotion]);

    useEffect(() => {
        if (prefersReducedMotion) {
            setBenefitsRevealed(true);
            return;
        }
        const el = benefitsRef.current;
        if (!el) {
            return;
        }
        const obs = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setBenefitsRevealed(true);
                }
            },
            { rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [prefersReducedMotion]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSearch(query.trim());
    };

    const videoGradient = {
        background: `
            linear-gradient(155deg,
                color-mix(in srgb, ${platform.color_primary} 88%, white) 0%,
                ${platform.color_primary} 38%,
                color-mix(in srgb, ${platform.color_accent} 75%, #f1f5f9) 100%
            )
        `,
    } as CSSProperties;

    const brandGradient = `linear-gradient(120deg, ${platform.color_primary}, ${platform.color_accent})`;

    const parallaxY = (px: number): CSSProperties | undefined =>
        prefersReducedMotion ? undefined : { transform: `translate3d(0, ${px}px, 0)`, willChange: 'transform' };

    return (
        <section ref={sectionRef} className="relative overflow-hidden border-b border-slate-200/50">
            {/* Fondo: capas suaves + rejilla muy tenue */}
            <div
                className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,#fafbfc_0%,#ffffff_45%,#f8fafc_100%)]"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] motion-reduce:transform-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 0% 0%, color-mix(in srgb, ${platform.color_primary} 20%, transparent) 0%, transparent 42%),
                        radial-gradient(circle at 100% 15%, color-mix(in srgb, ${platform.color_accent} 18%, transparent) 0%, transparent 38%)`,
                    ...parallaxY(shiftPx * 0.72),
                }}
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-0 -z-10 opacity-[0.4] motion-reduce:transform-none"
                style={{
                    backgroundImage: `linear-gradient(to right, rgb(148 163 184 / 0.07) 1px, transparent 1px),
                        linear-gradient(to bottom, rgb(148 163 184 / 0.07) 1px, transparent 1px)`,
                    backgroundSize: '48px 48px',
                    maskImage: 'radial-gradient(ellipse 80% 70% at 50% 0%, black, transparent)',
                    ...parallaxY(shiftPx * -0.38),
                }}
                aria-hidden
            />

            <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 lg:pb-24 lg:pt-16">
                <div className="grid items-start gap-14 lg:grid-cols-12 lg:items-center lg:gap-12">
                    {/* Columna principal — más aire, titular en capas */}
                    <div className="relative lg:col-span-7" style={parallaxY(shiftPx * 0.2)}>
                        <div
                            className="absolute -left-4 top-0 hidden h-32 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent lg:block"
                            aria-hidden
                        />
                        <div className="relative animate-in fade-in-0 slide-in-from-bottom-3 fill-mode-both duration-700 ease-out motion-reduce:animate-none lg:pl-5">
                            <p className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 font-medium text-slate-700 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-sm transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-slate-300/90 hover:shadow-md motion-reduce:hover:translate-y-0">
                                    <Sparkles
                                        className="size-3.5 shrink-0"
                                        style={{ color: platform.color_primary }}
                                        strokeWidth={2}
                                        aria-hidden
                                    />
                                    Catálogo actualizado
                                </span>
                                <span className="hidden text-slate-400 sm:inline">·</span>
                                <span className="hidden text-slate-500 sm:inline">Cursos y rutas en evolución</span>
                            </p>

                            <h1 className="max-w-2xl text-balance text-[1.85rem] font-bold leading-[1.12] tracking-tight text-slate-900 sm:text-[2.35rem] sm:leading-[1.1] lg:text-[2.55rem]">
                                Aprende con {accentSpan(platform, 'cursos reales')}, instructores {accentSpan(platform, 'expertos')} y rutas{' '}
                                {accentSpan(platform, 'claras')}.
                            </h1>

                            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-600 sm:text-[1.05rem]">
                                Compara por nivel y precio, revisa el contenido y elige docentes con perfil transparente.
                            </p>

                            <form onSubmit={submit} className="group/search mt-10 max-w-xl">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
                                    <div
                                        className={cn(
                                            'flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 shadow-sm transition-[border-color,box-shadow] duration-200',
                                            'focus-within:border-transparent focus-within:shadow-md focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--brand)_22%,transparent)]',
                                        )}
                                        style={{ '--brand': platform.color_primary } as CSSProperties}
                                    >
                                        <label className="flex min-w-0 flex-1 cursor-text items-center gap-3">
                                            <span className="sr-only">Buscar en el catálogo</span>
                                            <Search className="size-4 shrink-0 text-slate-400" strokeWidth={2.25} aria-hidden />
                                            <input
                                                value={query}
                                                onChange={(event) => setQuery(event.target.value)}
                                                placeholder="Laravel, diseño UX, inglés técnico…"
                                                className="w-full min-w-0 border-0 bg-transparent py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                                            />
                                        </label>
                                    </div>
                                    <button
                                        type="submit"
                                        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold text-white transition-[filter,transform,box-shadow] hover:brightness-[1.06] active:scale-[0.99] sm:min-w-[9.5rem]"
                                        style={{
                                            background: brandGradient,
                                            boxShadow: `0 10px 28px -12px color-mix(in srgb, ${platform.color_primary} 45%, transparent)`,
                                        }}
                                    >
                                        Buscar
                                        <ArrowRight className="size-4 opacity-90" aria-hidden />
                                    </button>
                                </div>
                                <p className="mt-2.5 text-xs text-slate-400">Mismo catálogo que el buscador del menú superior.</p>
                            </form>
                        </div>
                    </div>

                    {/* Vista producto — flotante, sin “caja pesada” */}
                    <div className="relative lg:col-span-5" style={parallaxY(shiftPx * -0.42)}>
                        <div
                            className="pointer-events-none absolute -right-6 top-8 hidden h-40 w-40 rounded-full opacity-[0.35] blur-3xl motion-reduce:transform-none lg:block"
                            style={{
                                background: `radial-gradient(circle, color-mix(in srgb, ${platform.color_accent} 35%, transparent), transparent 70%)`,
                                ...parallaxY(shiftPx * 0.55),
                            }}
                            aria-hidden
                        />

                        <div className="relative animate-in fade-in-0 slide-in-from-bottom-4 fill-mode-both delay-150 duration-700 ease-out motion-reduce:animate-none motion-reduce:delay-0">
                            <div className="overflow-hidden rounded-[1.35rem] border border-slate-200/70 bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/[0.03] transition-[transform,box-shadow] duration-500 ease-out will-change-transform hover:-translate-y-1 hover:shadow-[0_28px_72px_-30px_rgba(15,23,42,0.24)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:rounded-3xl">
                                <div className="flex items-center justify-between gap-3 border-b border-slate-100/90 bg-gradient-to-r from-slate-50 to-white px-4 py-2.5 sm:px-5">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-rose-400/90" aria-hidden />
                                        <span className="size-2 rounded-full bg-amber-400/90" aria-hidden />
                                        <span className="size-2 rounded-full bg-emerald-400/90" aria-hidden />
                                        <span className="ml-2 text-xs font-medium text-slate-500">Vista de clase</span>
                                    </div>
                                    <span className="rounded-md bg-slate-100/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                        Demo
                                    </span>
                                </div>

                                <div className="p-3.5 sm:p-5">
                                    <div
                                        className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-2xl"
                                        style={videoGradient}
                                    >
                                        <div
                                            className="pointer-events-none absolute inset-0 opacity-50"
                                            style={{
                                                background: `radial-gradient(ellipse 90% 80% at 50% 100%, color-mix(in srgb, ${platform.color_primary} 25%, transparent), transparent 55%)`,
                                            }}
                                            aria-hidden
                                        />
                                        <div
                                            className="pointer-events-none absolute inset-0 opacity-30"
                                            style={{
                                                background: `radial-gradient(circle at 25% 20%, white, transparent 45%)`,
                                            }}
                                            aria-hidden
                                        />
                                        <div
                                            className="pointer-events-none absolute inset-0 z-[1] overflow-hidden motion-reduce:hidden"
                                            aria-hidden
                                        >
                                            <div
                                                className="absolute inset-y-0 left-0 w-[42%] bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                                style={{
                                                    animation: 'marketplace-hero-shimmer 4.8s ease-in-out infinite',
                                                }}
                                            />
                                        </div>
                                        <div className="relative z-[2] flex size-14 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-white/50 motion-reduce:animate-none animate-[marketplace-hero-float_5s_ease-in-out_infinite] sm:size-16">
                                            <PlayCircle
                                                className="size-9 sm:size-10"
                                                strokeWidth={1.1}
                                                style={{ color: platform.color_primary }}
                                                aria-hidden
                                            />
                                        </div>
                                        <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4">
                                            <div className="h-1 overflow-hidden rounded-full bg-white/45">
                                                <div
                                                    className="motion-safe:animate-pulse h-full w-[42%] rounded-full bg-white"
                                                    style={{
                                                        boxShadow: `0 0 12px color-mix(in srgb, ${platform.color_primary} 55%, transparent)`,
                                                    }}
                                                />
                                            </div>
                                            <p className="mt-2 text-[11px] font-medium text-white/95 drop-shadow-sm">12:34 · Lección en curso</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 sm:mt-5">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Módulo 1</p>
                                        <p className="mt-1.5 text-base font-semibold leading-snug tracking-tight text-slate-900 sm:text-lg">
                                            De la teoría a la práctica en el mismo flujo
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                Nivel intermedio
                                            </span>
                                            <span
                                                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
                                                style={{ background: brandGradient }}
                                            >
                                                En curso
                                            </span>
                                        </div>
                                    </div>

                                    <div
                                        className="mt-4 flex items-start gap-3 rounded-xl px-3 py-3 sm:mt-5 sm:gap-3.5 sm:px-4 sm:py-3.5"
                                        style={{
                                            background: `linear-gradient(135deg, color-mix(in srgb, ${platform.color_primary} 8%, #f8fafc), color-mix(in srgb, ${platform.color_accent} 6%, #ffffff))`,
                                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.85)`,
                                        }}
                                    >
                                        <div
                                            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm sm:size-10"
                                            style={{ background: brandGradient }}
                                        >
                                            <Award className="size-[1.05rem] sm:size-[1.15rem]" aria-hidden />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                                Al completar el curso
                                            </p>
                                            <p className="text-sm font-medium leading-snug text-slate-800">
                                                Certificado de finalización incluido en tu perfil
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Beneficios — una sola banda amable, sin columnas “card” */}
                <div
                    ref={benefitsRef}
                    className={cn(
                        'mt-14 rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-700 ease-out motion-reduce:duration-0 sm:mt-16 sm:rounded-3xl sm:p-8 lg:p-10',
                        benefitsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
                    )}
                    style={{
                        boxShadow: `0 18px 50px -36px color-mix(in srgb, ${platform.color_primary} 18%, transparent), inset 0 1px 0 rgba(255,255,255,0.9)`,
                    }}
                >
                    <ul className="grid gap-8 sm:grid-cols-3 sm:gap-6 lg:gap-10">
                        {learnerBenefits.map(({ icon: Icon, title, text }, index) => (
                            <li
                                key={title}
                                className={cn(
                                    'relative flex gap-4 transition-all duration-700 ease-out motion-reduce:delay-0 motion-reduce:duration-0',
                                    benefitsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
                                    index === 1 && 'delay-100',
                                    index === 2 && 'delay-200',
                                    index > 0 && 'sm:border-l sm:border-slate-200/70 sm:pl-6 lg:pl-10',
                                )}
                            >
                                <span
                                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                                    style={{ background: brandGradient }}
                                >
                                    <Icon className="size-5 opacity-95" strokeWidth={2} aria-hidden />
                                </span>
                                <div className="min-w-0 pt-0.5">
                                    <p className="font-semibold text-slate-900">{title}</p>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
