import type { PlatformSettings } from '@/types/platform';

type LandingFooterProps = {
    platform: PlatformSettings;
};

export function LandingFooter({ platform }: LandingFooterProps) {
    return (
        <footer className="mt-auto border-t border-slate-200 bg-white">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <p>© {new Date().getFullYear()} {platform.app_name}. Todos los derechos reservados.</p>

                <div className="flex flex-wrap items-center gap-4">
                    {platform.terms_url ? (
                        <a href={platform.terms_url} target="_blank" rel="noreferrer" className="transition-colors hover:text-slate-700">
                            Terminos
                        </a>
                    ) : null}
                    {platform.privacy_url ? (
                        <a href={platform.privacy_url} target="_blank" rel="noreferrer" className="transition-colors hover:text-slate-700">
                            Privacidad
                        </a>
                    ) : null}
                    {platform.support_url ? (
                        <a href={platform.support_url} target="_blank" rel="noreferrer" className="transition-colors hover:text-slate-700">
                            Soporte
                        </a>
                    ) : null}
                </div>
            </div>
        </footer>
    );
}
