import { Link } from '@inertiajs/react';
import {
    ExternalLink,
    Facebook,
    Instagram,
    Linkedin,
    Mail,
    Youtube,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { home, login, register } from '@/routes';
import { cn } from '@/lib/utils';
import type { PlatformSettings } from '@/types/platform';

type PublicFooterProps = {
    platform: PlatformSettings;
    canRegister: boolean;
};

/** Acepta URLs con o sin esquema (p. ej. `orvae.pe/ayuda` → `https://orvae.pe/ayuda`). */
function hrefForExternal(raw: string | null | undefined): string | null {
    const t = raw?.trim();
    if (!t) {
        return null;
    }
    if (/^https?:\/\//i.test(t) || t.startsWith('//')) {
        return t;
    }
    if (t.startsWith('mailto:') || t.startsWith('tel:')) {
        return t;
    }

    return `https://${t}`;
}

const SOCIAL_NETWORKS: ReadonlyArray<{
    label: string;
    getUrl: (p: PlatformSettings) => string | null | undefined;
    Icon: LucideIcon;
}> = [
    { label: 'Facebook', getUrl: (p) => p.social_facebook, Icon: Facebook },
    { label: 'Instagram', getUrl: (p) => p.social_instagram, Icon: Instagram },
    { label: 'LinkedIn', getUrl: (p) => p.social_linkedin, Icon: Linkedin },
    { label: 'YouTube', getUrl: (p) => p.social_youtube, Icon: Youtube },
];

export function PublicFooter({ platform, canRegister }: PublicFooterProps) {
    const year = new Date().getFullYear();
    const supportHref = hrefForExternal(platform.support_url);
    const termsHref = hrefForExternal(platform.terms_url);
    const privacyHref = hrefForExternal(platform.privacy_url);
    const showLegalColumn = Boolean(supportHref || termsHref || privacyHref);
    const tagline =
        platform.app_tagline?.trim() ||
        'Plataforma de aprendizaje en línea. Cursos prácticos, instructores expertos y rutas claras para tu objetivo profesional.';

    return (
        <footer className="relative border-t border-slate-800/90 bg-slate-950 text-slate-400">
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-90"
                style={{
                    background: `linear-gradient(90deg, transparent, ${platform.color_primary}, ${platform.color_accent}, transparent)`,
                }}
                aria-hidden
            />

            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
                    {/* Marca + contacto directo */}
                    <div className="lg:col-span-5">
                        <Link
                            href={home()}
                            className="inline-flex cursor-pointer items-center gap-3 rounded-xl outline-offset-4 transition-opacity hover:opacity-95"
                        >
                            <img
                                src={platform.icon_url}
                                alt=""
                                className="size-11 rounded-xl object-contain ring-1 ring-white/10"
                            />
                            <span className="text-lg font-bold tracking-tight text-white">{platform.app_name}</span>
                        </Link>

                        <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">{tagline}</p>

                        {platform.contact_email ? (
                            <a
                                href={`mailto:${platform.contact_email}`}
                                className="mt-6 inline-flex w-fit cursor-pointer items-center gap-2.5 rounded-xl border border-white/10 bg-white/4 px-3.5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/7 hover:text-white"
                            >
                                <Mail className="size-4 shrink-0 text-slate-500" aria-hidden />
                                {platform.contact_email}
                            </a>
                        ) : null}

                        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Redes sociales">
                            {SOCIAL_NETWORKS.map(({ label, getUrl, Icon }) => {
                                const href = hrefForExternal(getUrl(platform));

                                return (
                                    <li key={label}>
                                        {href ? (
                                            <a
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer me"
                                                title={label}
                                                aria-label={label}
                                                className={cn(
                                                    'flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/4',
                                                    'text-slate-400 transition-colors duration-200',
                                                    'hover:border-white/25 hover:bg-white/8 hover:text-white',
                                                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40',
                                                )}
                                            >
                                                <Icon className="size-[1.15rem]" strokeWidth={1.75} aria-hidden />
                                            </a>
                                        ) : (
                                            <span
                                                className={cn(
                                                    'flex size-10 cursor-default items-center justify-center rounded-full border border-white/5 bg-white/2',
                                                    'text-slate-600',
                                                )}
                                                title={`${label}: configura la URL en administración`}
                                                aria-label={`${label}: sin enlace configurado`}
                                            >
                                                <Icon className="size-[1.15rem]" strokeWidth={1.5} aria-hidden />
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Columnas de enlaces */}
                    <div
                        className={cn(
                            'grid grid-cols-2 gap-10 lg:col-span-7 lg:gap-8',
                            showLegalColumn ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
                        )}
                    >
                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Catálogo</h3>
                            <ul className="mt-4 space-y-3 text-sm">
                                <li>
                                    <a
                                        href={`${home.url()}#explorar`}
                                        className="inline-flex cursor-pointer items-center gap-1 text-slate-300 transition-colors hover:text-white"
                                    >
                                        Explorar cursos
                                        <ExternalLink className="size-3.5 opacity-50" aria-hidden />
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Cuenta</h3>
                            <ul className="mt-4 space-y-3 text-sm">
                                <li>
                                    <Link href={login()} className="cursor-pointer text-slate-300 transition-colors hover:text-white">
                                        Iniciar sesión
                                    </Link>
                                </li>
                                {canRegister ? (
                                    <li>
                                        <Link href={register()} className="cursor-pointer text-slate-300 transition-colors hover:text-white">
                                            Registrarse
                                        </Link>
                                    </li>
                                ) : null}
                            </ul>
                        </div>

                        {showLegalColumn ? (
                            <div className="col-span-2 sm:col-span-1">
                                <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Ayuda y legal</h3>
                                <ul className="mt-4 space-y-3 text-sm">
                                    {supportHref ? (
                                        <li>
                                            <a
                                                href={supportHref}
                                                className="inline-flex cursor-pointer items-center gap-1.5 text-slate-300 transition-colors hover:text-white"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Centro de ayuda
                                                <ExternalLink className="size-3.5 shrink-0 opacity-50" aria-hidden />
                                            </a>
                                        </li>
                                    ) : null}
                                    {termsHref ? (
                                        <li>
                                            <a
                                                href={termsHref}
                                                className="inline-flex cursor-pointer items-center gap-1.5 text-slate-300 transition-colors hover:text-white"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Términos y condiciones
                                                <ExternalLink className="size-3.5 shrink-0 opacity-50" aria-hidden />
                                            </a>
                                        </li>
                                    ) : null}
                                    {privacyHref ? (
                                        <li>
                                            <a
                                                href={privacyHref}
                                                className="inline-flex cursor-pointer items-center gap-1.5 text-slate-300 transition-colors hover:text-white"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Política de privacidad
                                                <ExternalLink className="size-3.5 shrink-0 opacity-50" aria-hidden />
                                            </a>
                                        </li>
                                    ) : null}
                                </ul>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="mt-14 border-t border-white/10 pt-8 text-center text-xs text-slate-500 sm:text-left">
                    <p>
                        © {year}{' '}
                        <span className="font-medium text-slate-400">{platform.app_name}</span>. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
}
