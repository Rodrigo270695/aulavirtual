import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { register } from '@/routes';
import { platformImgOnDarkClass } from '@/lib/platform-media';
import type { PlatformSettings } from '@/types/platform';

type LandingFinalCtaProps = {
    platform: PlatformSettings;
    canRegister: boolean;
};

export function LandingFinalCta({ platform, canRegister }: LandingFinalCtaProps) {
    if (!canRegister) {
        return null;
    }

    return (
        <section className="mx-auto mb-20 w-full max-w-4xl px-6">
            <div
                className="relative overflow-hidden rounded-3xl p-10 text-center text-white shadow-xl"
                style={{ background: `linear-gradient(135deg, ${platform.login_bg_from} 0%, ${platform.login_bg_to} 60%, ${platform.color_accent} 100%)` }}
            >
                <div className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-white opacity-[0.06] blur-2xl" aria-hidden />
                <div className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full bg-white opacity-[0.05] blur-xl" aria-hidden />

                <img
                    src={platform.icon_url}
                    alt={platform.app_name}
                    className={platformImgOnDarkClass(
                        platform.icon_url,
                        'mx-auto mb-4 size-12 object-contain',
                    )}
                />
                <h2 className="text-2xl font-bold">Tu siguiente habilidad empieza hoy</h2>
                <p className="mt-2 text-sm text-white/80">
                    Crea tu cuenta y accede a cursos con enfoque practico y profesional.
                </p>
                <Link
                    href={register()}
                    className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-semibold shadow-md transition-all hover:bg-slate-50 hover:shadow-lg"
                    style={{ color: platform.color_primary }}
                >
                    Crear cuenta gratis
                    <ArrowRight className="size-4" />
                </Link>
            </div>
        </section>
    );
}
