import { landingCategories } from '@/components/landing/landing-data';
import type { PlatformSettings } from '@/types/platform';

type LandingCategoriesProps = {
    platform: PlatformSettings;
};

export function LandingCategories({ platform }: LandingCategoriesProps) {
    return (
        <section id="categorias" className="mx-auto max-w-6xl px-6 py-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-bold text-slate-900">Categorias mas buscadas</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Rutas de aprendizaje para perfiles tecnicos y profesionales.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                    {landingCategories.map((category) => (
                        <button
                            key={category.name}
                            type="button"
                            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
                            style={{ boxShadow: `inset 0 0 0 1px ${platform.color_primary}10` }}
                        >
                            {category.name} ({category.courses})
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
