import { Link } from '@inertiajs/react';
import { ArrowRight, Search } from 'lucide-react';
import { login, register } from '@/routes';
import { landingStats } from '@/components/landing/landing-data';
import type { PlatformSettings } from '@/types/platform';

type LandingHeroProps = {
    platform: PlatformSettings;
    canRegister: boolean;
};

export function LandingHero({ platform, canRegister }: LandingHeroProps) {
    const tagline = platform.app_tagline ?? 'Aprende habilidades con cursos practicos';
    const description = platform.login_tagline ?? 'Capacitate con contenido moderno, proyectos reales y acompanamiento experto.';

    return (
        <section className="relative overflow-hidden">
            <div
                className="absolute inset-0 -z-10"
                style={{
                    background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${platform.login_bg_from}25 0%, transparent 72%)`,
                }}
                aria-hidden
            />

            <div className="mx-auto max-w-6xl px-6 py-20 text-center lg:py-28">
                <div
                    className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
                    style={{ background: `${platform.color_primary}15`, color: platform.color_primary }}
                >
                    Tu plataforma de aprendizaje estilo marketplace
                </div>

                <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 lg:text-6xl">
                    {tagline}
                </h1>
                <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-500">{description}</p>

                <div className="mx-auto mt-9 flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                    <Search className="ml-2 size-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Busca cursos de desarrollo, diseno, datos..."
                        className="h-10 w-full rounded-xl border-none px-2 text-sm text-slate-700 outline-none"
                        readOnly
                    />
                    <button
                        type="button"
                        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                        style={{ background: platform.color_primary }}
                    >
                        Explorar
                    </button>
                </div>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    {canRegister && (
                        <Link
                            href={register()}
                            className="group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90"
                            style={{ background: `linear-gradient(135deg, ${platform.color_primary} 0%, ${platform.color_accent} 100%)` }}
                        >
                            Comenzar gratis
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    )}
                    <Link
                        href={login()}
                        className="inline-flex items-center rounded-xl border border-slate-200 px-7 py-3.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50"
                    >
                        Ya tengo cuenta
                    </Link>
                </div>

                <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
                    {landingStats.map((item) => (
                        <div key={item.label} className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-slate-900">{item.value}</span>
                            <span className="mt-0.5 text-sm text-slate-400">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
