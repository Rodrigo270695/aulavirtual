import { BookOpen, GraduationCap, ShieldCheck, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PlatformSettings } from '@/types/platform';

type LandingBenefitsProps = {
    platform: PlatformSettings;
};

type BenefitItem = {
    icon: LucideIcon;
    title: string;
    description: string;
};

const BENEFITS: BenefitItem[] = [
    {
        icon: BookOpen,
        title: 'Contenido actualizado',
        description: 'Cursos orientados a las herramientas y stacks mas demandados del mercado.',
    },
    {
        icon: GraduationCap,
        title: 'Aprendizaje a tu ritmo',
        description: 'Avanza desde cualquier dispositivo y retoma donde dejaste cada clase.',
    },
    {
        icon: Trophy,
        title: 'Progreso medible',
        description: 'Sigue tu avance por leccion, modulo y curso para mantener motivacion constante.',
    },
    {
        icon: ShieldCheck,
        title: 'Certificados verificables',
        description: 'Demuestra tus logros con certificados compartibles y faciles de validar.',
    },
];

export function LandingBenefits({ platform }: LandingBenefitsProps) {
    return (
        <section className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="mb-8 text-center text-3xl font-bold text-slate-900">
                Todo lo que necesitas para aprender
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {BENEFITS.map((item) => {
                    const Icon = item.icon;
                    return (
                        <article
                            key={item.title}
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-shadow hover:shadow-md"
                        >
                            <div
                                className="mb-4 flex size-10 items-center justify-center rounded-xl"
                                style={{ background: `${platform.color_primary}15` }}
                            >
                                <Icon className="size-5" style={{ color: platform.color_primary }} />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.description}</p>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
