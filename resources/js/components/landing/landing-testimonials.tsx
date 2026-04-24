import { Star } from 'lucide-react';
import { landingTestimonials } from '@/components/landing/landing-data';
import type { PlatformSettings } from '@/types/platform';

type LandingTestimonialsProps = {
    platform: PlatformSettings;
};

export function LandingTestimonials({ platform }: LandingTestimonialsProps) {
    return (
        <section id="testimonios" className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-center text-3xl font-bold text-slate-900">
                Lo que dicen nuestros estudiantes
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500">
                Experiencias reales de personas que ya estan aprendiendo con la plataforma.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {landingTestimonials.map((testimonial) => (
                    <article
                        key={testimonial.name}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
                    >
                        <div className="mb-4 flex items-center gap-1">
                            {Array.from({ length: testimonial.rating }).map((_, idx) => (
                                <Star key={`${testimonial.name}-${idx}`} className="size-4 fill-amber-400 text-amber-400" />
                            ))}
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600">"{testimonial.text}"</p>
                        <div className="mt-4">
                            <p className="text-sm font-semibold text-slate-900">{testimonial.name}</p>
                            <p className="text-xs text-slate-500">{testimonial.role}</p>
                        </div>
                    </article>
                ))}
            </div>

            <div
                className="mt-10 rounded-2xl px-6 py-5 text-center text-sm font-medium"
                style={{ background: `${platform.color_primary}10`, color: platform.color_primary }}
            >
                +95% de estudiantes recomiendan esta experiencia de aprendizaje.
            </div>
        </section>
    );
}
