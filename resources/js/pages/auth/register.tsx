import { Form, Head } from '@inertiajs/react';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useCallback } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { usePlatform } from '@/hooks/use-platform';
import { oauthPostLoginPath } from '@/lib/utils';
import { login } from '@/routes';
import { store } from '@/routes/register';

// Estilos estáticos — la card siempre es blanca independiente del dark mode
const INPUT_STYLE: React.CSSProperties = {
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    color: '#0f172a',
};
const LABEL_STYLE: React.CSSProperties = { color: '#374151', fontWeight: 600, fontSize: '0.8125rem' };
const MUTED_STYLE: React.CSSProperties  = { color: '#6b7280' };

export default function Register() {
    const { app_name, color_primary, color_accent } = usePlatform();

    const openSocialPopup = useCallback((provider: string) => {
        const w = 500;
        const h = 650;
        const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
        const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
        const popup = window.open(
            `/auth/social/${provider}`,
            `${provider}_oauth`,
            `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`,
        );
        if (!popup || popup.closed) {
            window.location.assign(`/auth/social/${provider}`);
            return;
        }
        function handleMessage(event: MessageEvent) {
            if (event.origin !== window.location.origin) {
                return;
            }
            if (event.data?.type === 'oauth-success') {
                window.removeEventListener('message', handleMessage);
                window.location.assign(oauthPostLoginPath(event.data.redirectTo, '/dashboard'));
            }
            if (event.data?.type === 'oauth-error') {
                window.removeEventListener('message', handleMessage);
                window.location.reload();
            }
        }
        window.addEventListener('message', handleMessage);
    }, []);

    return (
        <>
            <Head title={`Crear cuenta · ${app_name}`} />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <>
                        {/* Nombre y Apellido en grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="first_name" style={LABEL_STYLE}>Nombre</Label>
                                <div className="relative">
                                    <User className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[15px] -translate-y-1/2"
                                        style={{ color: '#94a3b8' }} />
                                    <Input
                                        id="first_name" type="text" name="first_name"
                                        required autoFocus tabIndex={1}
                                        autoComplete="given-name"
                                        placeholder="Juan"
                                        style={INPUT_STYLE}
                                        className="h-11 rounded-xl pl-10 pr-4 text-sm transition-all duration-150
                                                   placeholder:text-slate-400
                                                   focus-visible:ring-[3px] focus-visible:ring-blue-500/20
                                                   focus-visible:border-blue-500/60"
                                    />
                                </div>
                                <InputError message={errors.first_name} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="last_name" style={LABEL_STYLE}>Apellido</Label>
                                <div className="relative">
                                    <User className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[15px] -translate-y-1/2"
                                        style={{ color: '#94a3b8' }} />
                                    <Input
                                        id="last_name" type="text" name="last_name"
                                        required tabIndex={2}
                                        autoComplete="family-name"
                                        placeholder="Pérez"
                                        style={INPUT_STYLE}
                                        className="h-11 rounded-xl pl-10 pr-4 text-sm transition-all duration-150
                                                   placeholder:text-slate-400
                                                   focus-visible:ring-[3px] focus-visible:ring-blue-500/20
                                                   focus-visible:border-blue-500/60"
                                    />
                                </div>
                                <InputError message={errors.last_name} />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="email" style={LABEL_STYLE}>Correo electrónico</Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[15px] -translate-y-1/2"
                                    style={{ color: '#94a3b8' }} />
                                <Input
                                    id="email" type="email" name="email"
                                    required tabIndex={3}
                                    autoComplete="email"
                                    placeholder="tu@correo.com"
                                    style={INPUT_STYLE}
                                    className="h-11 rounded-xl pl-10 pr-4 text-sm transition-all duration-150
                                               placeholder:text-slate-400
                                               focus-visible:ring-[3px] focus-visible:ring-blue-500/20
                                               focus-visible:border-blue-500/60"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        {/* Contraseña */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="password" style={LABEL_STYLE}>Contraseña</Label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[15px] -translate-y-1/2"
                                    style={{ color: '#94a3b8' }} />
                                <PasswordInput
                                    id="password" name="password"
                                    required tabIndex={4}
                                    autoComplete="new-password"
                                    placeholder="Mínimo 8 caracteres"
                                    style={INPUT_STYLE}
                                    className="h-11 rounded-xl pl-10 pr-11 text-sm transition-all duration-150
                                               placeholder:text-slate-400
                                               focus-visible:ring-[3px] focus-visible:ring-blue-500/20
                                               focus-visible:border-blue-500/60"
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        {/* Confirmar contraseña */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="password_confirmation" style={LABEL_STYLE}>Confirmar contraseña</Label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[15px] -translate-y-1/2"
                                    style={{ color: '#94a3b8' }} />
                                <PasswordInput
                                    id="password_confirmation" name="password_confirmation"
                                    required tabIndex={5}
                                    autoComplete="new-password"
                                    placeholder="Repite tu contraseña"
                                    style={INPUT_STYLE}
                                    className="h-11 rounded-xl pl-10 pr-11 text-sm transition-all duration-150
                                               placeholder:text-slate-400
                                               focus-visible:ring-[3px] focus-visible:ring-blue-500/20
                                               focus-visible:border-blue-500/60"
                                />
                            </div>
                            <InputError message={errors.password_confirmation} />
                        </div>

                        {/* Botón principal */}
                        <Button
                            type="submit" tabIndex={6} disabled={processing}
                            data-test="register-user-button"
                            className="group mt-1 h-11 w-full cursor-pointer gap-2 rounded-xl border-0
                                       text-[0.9rem] font-semibold text-white shadow-md
                                       transition-all duration-200 hover:opacity-90 hover:shadow-lg
                                       active:scale-[0.983]"
                            style={{ background: `linear-gradient(135deg, ${color_primary} 0%, ${color_accent} 100%)` }}
                        >
                            {processing ? (
                                <><Spinner className="size-4" /><span>Creando cuenta…</span></>
                            ) : (
                                <>
                                    <span>Crear cuenta</span>
                                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.5} />
                                </>
                            )}
                        </Button>

                        {/* Divisor */}
                        <div className="relative flex items-center gap-3">
                            <div className="h-px flex-1" style={{ background: '#e2e8f0' }} />
                            <span className="text-[0.68rem] font-medium uppercase tracking-widest" style={MUTED_STYLE}>
                                o continúa con
                            </span>
                            <div className="h-px flex-1" style={{ background: '#e2e8f0' }} />
                        </div>

                        {/* Botones sociales — abren popup */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => openSocialPopup('google')}
                                className="flex cursor-pointer items-center justify-center gap-2.5 rounded-xl
                                           px-4 py-2.5 text-sm font-medium shadow-xs
                                           transition-all duration-150 hover:shadow-sm active:scale-[0.98]"
                                style={{ background: '#fff', border: '1.5px solid #e2e8f0', color: '#374151' }}
                            >
                                <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Google
                            </button>

                            <button
                                type="button"
                                onClick={() => openSocialPopup('github')}
                                className="flex cursor-pointer items-center justify-center gap-2.5 rounded-xl
                                           px-4 py-2.5 text-sm font-medium shadow-xs
                                           transition-all duration-150 hover:shadow-sm active:scale-[0.98]"
                                style={{ background: '#24292f', border: '1.5px solid #24292f', color: '#ffffff' }}
                            >
                                <svg className="size-4 shrink-0 fill-white" viewBox="0 0 24 24" aria-hidden>
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                                </svg>
                                GitHub
                            </button>
                        </div>

                        {/* Ya tienes cuenta */}
                        <p className="text-center text-sm" style={MUTED_STYLE}>
                            ¿Ya tienes una cuenta?{' '}
                            <TextLink href={login()} tabIndex={7}
                                className="cursor-pointer font-semibold transition-colors"
                                style={{ color: color_primary }}>
                                Inicia sesión
                            </TextLink>
                        </p>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Crea tu cuenta',
    description: 'Únete y empieza a aprender hoy mismo.',
};
