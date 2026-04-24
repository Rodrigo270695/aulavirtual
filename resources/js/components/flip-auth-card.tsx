/**
 * FlipAuthCard
 * ─────────────────────────────────────────────────────────────────────────────
 * Card de autenticación con animación 3D de volteo entre vistas.
 *
 * Técnica: "medio giro de salida → swap de contenido → medio giro de entrada"
 *   Phase 'out'   : rotateY 0 → 90°  (card desaparece)
 *   Phase 'swap'  : swap instantáneo de contenido, posiciona en -90°
 *   Phase 'in'    : rotateY -90° → 0° (card aparece con nuevo contenido)
 */
import { Form, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { usePlatform } from '@/hooks/use-platform';
import { platformImgOnDarkClass } from '@/lib/platform-media';
import { oauthPostLoginPath } from '@/lib/utils';
import { home } from '@/routes';
import { store as loginStore } from '@/routes/login';
import { email as forgotEmail } from '@/routes/password';
import { store as registerStore } from '@/routes/register';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AuthView = 'login' | 'register' | 'forgot';
type FlipPhase = 'idle' | 'out' | 'swap' | 'in';

const VIEW_META: Record<AuthView, { title: string; description: string }> = {
    login:    { title: 'Bienvenido de vuelta',   description: 'Ingresa tus credenciales para continuar.' },
    register: { title: 'Crea tu cuenta',          description: 'Únete y empieza a aprender hoy mismo.' },
    forgot:   { title: 'Recuperar contraseña',    description: 'Te enviamos un enlace a tu correo.' },
};

// ─── Estilos estáticos ────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = { background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#0f172a' };
const INPUT_READONLY: React.CSSProperties = { background: '#f1f5f9', border: '1.5px solid #e2e8f0', color: '#64748b' };
const LABEL: React.CSSProperties = { color: '#374151', fontWeight: 600, fontSize: '0.8125rem' };
const MUTED: React.CSSProperties  = { color: '#6b7280' };

// ─── Sub-componentes de formulario ────────────────────────────────────────────

function SubmitBtn({
    processing,
    label,
    loadingLabel,
    color_primary,
    color_accent,
    tabIndex,
    testId,
}: {
    processing: boolean;
    label: string;
    loadingLabel: string;
    color_primary: string;
    color_accent: string;
    tabIndex?: number;
    testId?: string;
}) {
    return (
        <Button
            type="submit"
            tabIndex={tabIndex}
            disabled={processing}
            data-test={testId}
            className="group mt-2 h-11 w-full cursor-pointer gap-2 rounded-xl border-0
                       text-[0.9rem] font-semibold text-white shadow-md
                       transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-[0.983]"
            style={{ background: `linear-gradient(135deg, ${color_primary} 0%, ${color_accent} 100%)` }}
        >
            {processing ? (
                <><Spinner className="size-4" /><span>{loadingLabel}</span></>
            ) : (
                <>
                    <span>{label}</span>
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.5} />
                </>
            )}
        </Button>
    );
}

// ─── Formulario: Login ───────────────────────────────────────────────────────

function LoginForm({
    canResetPassword,
    canRegister,
    status,
    color_primary,
    color_accent,
    flipTo,
}: {
    canResetPassword: boolean;
    canRegister: boolean;
    status?: string;
    color_primary: string;
    color_accent: string;
    flipTo: (v: AuthView) => void;
}) {
    const flash = usePage<{ flash?: { error?: string | null } }>().props.flash;

    return (
        <Form action={loginStore.url()} method="post" resetOnSuccess={['password']} className="flex flex-col gap-4">
            {({ processing, errors }) => (
                <>
                    {flash?.error ? (
                        <div
                            className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                            role="alert"
                        >
                            <span className="size-2 shrink-0 rounded-full bg-red-400" aria-hidden />
                            {flash.error}
                        </div>
                    ) : null}
                    {status && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}
                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm">
                            <span className="size-2 shrink-0 rounded-full bg-emerald-400" />
                            {status}
                        </div>
                    )}

                    {/* Email */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="l-email" style={LABEL}>Correo electrónico</Label>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-[15px] -translate-y-1/2" style={{ color: '#94a3b8' }} />
                            <Input id="l-email" type="email" name="email" required autoFocus tabIndex={1}
                                autoComplete="email" placeholder="tu@correo.com"
                                style={INPUT_STYLE}
                                className="h-11 rounded-xl pl-10 pr-4 text-sm transition-all duration-150 placeholder:text-slate-400
                                           focus-visible:ring-[3px] focus-visible:ring-blue-500/20 focus-visible:border-blue-500/60" />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    {/* Contraseña */}
                    <div className="grid gap-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="l-password" style={LABEL}>Contraseña</Label>
                            {canResetPassword && (
                                <button type="button" tabIndex={5} onClick={() => flipTo('forgot')}
                                    className="cursor-pointer text-[0.775rem] font-medium transition-colors"
                                    style={{ color: color_primary }}>
                                    ¿Olvidaste tu contraseña?
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[15px] -translate-y-1/2" style={{ color: '#94a3b8' }} />
                            <PasswordInput id="l-password" name="password" required tabIndex={2}
                                autoComplete="current-password" placeholder="••••••••"
                                style={INPUT_STYLE}
                                className="h-11 rounded-xl pl-10 pr-11 text-sm transition-all duration-150 placeholder:text-slate-400
                                           focus-visible:ring-[3px] focus-visible:ring-blue-500/20 focus-visible:border-blue-500/60" />
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    {/* Recordarme */}
                    <div className="flex items-center gap-2.5">
                        <Checkbox id="l-remember" name="remember" tabIndex={3} className="cursor-pointer size-4 rounded-[5px]" />
                        <Label htmlFor="l-remember" style={MUTED} className="cursor-pointer select-none text-sm">
                            Mantener sesión iniciada
                        </Label>
                    </div>

                    <SubmitBtn processing={processing} label="Iniciar sesión" loadingLabel="Verificando…"
                        color_primary={color_primary} color_accent={color_accent} tabIndex={4} testId="login-button" />

                    {/* Divisor */}
                    <div className="relative flex items-center gap-3">
                        <div className="h-px flex-1" style={{ background: '#e2e8f0' }} />
                        <span className="text-[0.68rem] font-medium uppercase tracking-widest" style={MUTED}>o continúa con</span>
                        <div className="h-px flex-1" style={{ background: '#e2e8f0' }} />
                    </div>

                    {/* Botones sociales */}
                    <SocialButtons />

                    {/* Registro */}
                    {canRegister && (
                        <p className="text-center text-sm" style={MUTED}>
                            ¿No tienes una cuenta?{' '}
                            <button type="button" onClick={() => flipTo('register')}
                                className="cursor-pointer font-semibold transition-colors"
                                style={{ color: color_primary }}>
                                Crear cuenta gratis
                            </button>
                        </p>
                    )}
                </>
            )}
        </Form>
    );
}

// ─── Formulario: Registro ─────────────────────────────────────────────────────

function RegisterForm({
    color_primary,
    color_accent,
    flipTo,
}: {
    color_primary: string;
    color_accent: string;
    flipTo: (v: AuthView) => void;
}) {
    return (
        <Form
            action={registerStore.url()}
            method="post"
            resetOnSuccess={['password', 'password_confirmation']}
            disableWhileProcessing
            className="flex flex-col gap-4"
        >
            {({ processing, errors }) => (
                <>
                    {/* Nombre + Apellido */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="r-first_name" style={LABEL}>Nombre</Label>
                            <div className="relative">
                                <User className="pointer-events-none absolute left-3.5 top-1/2 size-[15px] -translate-y-1/2" style={{ color: '#94a3b8' }} />
                                <Input id="r-first_name" type="text" name="first_name" required autoFocus tabIndex={1}
                                    autoComplete="given-name" placeholder="Juan" style={INPUT_STYLE}
                                    className="h-11 rounded-xl pl-10 pr-4 text-sm transition-all duration-150 placeholder:text-slate-400
                                               focus-visible:ring-[3px] focus-visible:ring-blue-500/20 focus-visible:border-blue-500/60" />
                            </div>
                            <InputError message={errors.first_name} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="r-last_name" style={LABEL}>Apellido</Label>
                            <div className="relative">
                                <User className="pointer-events-none absolute left-3.5 top-1/2 size-[15px] -translate-y-1/2" style={{ color: '#94a3b8' }} />
                                <Input id="r-last_name" type="text" name="last_name" required tabIndex={2}
                                    autoComplete="family-name" placeholder="Pérez" style={INPUT_STYLE}
                                    className="h-11 rounded-xl pl-10 pr-4 text-sm transition-all duration-150 placeholder:text-slate-400
                                               focus-visible:ring-[3px] focus-visible:ring-blue-500/20 focus-visible:border-blue-500/60" />
                            </div>
                            <InputError message={errors.last_name} />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="r-email" style={LABEL}>Correo electrónico</Label>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-[15px] -translate-y-1/2" style={{ color: '#94a3b8' }} />
                            <Input id="r-email" type="email" name="email" required tabIndex={3}
                                autoComplete="email" placeholder="tu@correo.com" style={INPUT_STYLE}
                                className="h-11 rounded-xl pl-10 pr-4 text-sm transition-all duration-150 placeholder:text-slate-400
                                           focus-visible:ring-[3px] focus-visible:ring-blue-500/20 focus-visible:border-blue-500/60" />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    {/* Contraseña */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="r-password" style={LABEL}>Contraseña</Label>
                        <div className="relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[15px] -translate-y-1/2" style={{ color: '#94a3b8' }} />
                            <PasswordInput id="r-password" name="password" required tabIndex={4}
                                autoComplete="new-password" placeholder="Mínimo 8 caracteres" style={INPUT_STYLE}
                                className="h-11 rounded-xl pl-10 pr-11 text-sm transition-all duration-150 placeholder:text-slate-400
                                           focus-visible:ring-[3px] focus-visible:ring-blue-500/20 focus-visible:border-blue-500/60" />
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    {/* Confirmar */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="r-password_confirmation" style={LABEL}>Confirmar contraseña</Label>
                        <div className="relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[15px] -translate-y-1/2" style={{ color: '#94a3b8' }} />
                            <PasswordInput id="r-password_confirmation" name="password_confirmation" required tabIndex={5}
                                autoComplete="new-password" placeholder="Repite tu contraseña" style={INPUT_STYLE}
                                className="h-11 rounded-xl pl-10 pr-11 text-sm transition-all duration-150 placeholder:text-slate-400
                                           focus-visible:ring-[3px] focus-visible:ring-blue-500/20 focus-visible:border-blue-500/60" />
                        </div>
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <SubmitBtn processing={processing} label="Crear cuenta" loadingLabel="Creando cuenta…"
                        color_primary={color_primary} color_accent={color_accent} tabIndex={6} testId="register-user-button" />

                    {/* Divisor */}
                    <div className="relative flex items-center gap-3">
                        <div className="h-px flex-1" style={{ background: '#e2e8f0' }} />
                        <span className="text-[0.68rem] font-medium uppercase tracking-widest" style={MUTED}>o continúa con</span>
                        <div className="h-px flex-1" style={{ background: '#e2e8f0' }} />
                    </div>
                    <SocialButtons />

                    <p className="text-center text-sm" style={MUTED}>
                        ¿Ya tienes cuenta?{' '}
                        <button type="button" onClick={() => flipTo('login')}
                            className="cursor-pointer font-semibold" style={{ color: color_primary }}>
                            Inicia sesión
                        </button>
                    </p>
                </>
            )}
        </Form>
    );
}

// ─── Formulario: Recuperar contraseña ─────────────────────────────────────────

function ForgotForm({
    color_primary,
    color_accent,
    flipTo,
}: {
    color_primary: string;
    color_accent: string;
    flipTo: (v: AuthView) => void;
}) {
    return (
        <Form action={forgotEmail.url()} method="post" className="flex flex-col gap-4">
            {({ processing, errors }) => (
                <>
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-email" style={LABEL}>Correo electrónico</Label>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-[15px] -translate-y-1/2" style={{ color: '#94a3b8' }} />
                            <Input id="f-email" type="email" name="email" required autoFocus tabIndex={1}
                                autoComplete="email" placeholder="tu@correo.com" style={INPUT_STYLE}
                                className="h-11 rounded-xl pl-10 pr-4 text-sm transition-all duration-150 placeholder:text-slate-400
                                           focus-visible:ring-[3px] focus-visible:ring-blue-500/20 focus-visible:border-blue-500/60" />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    <SubmitBtn processing={processing} label="Enviar enlace de recuperación" loadingLabel="Enviando…"
                        color_primary={color_primary} color_accent={color_accent} tabIndex={2}
                        testId="email-password-reset-link-button" />

                    <button type="button" onClick={() => flipTo('login')}
                        className="flex cursor-pointer items-center justify-center gap-1.5 text-sm font-medium transition-colors"
                        style={{ color: color_primary }}>
                        <ArrowLeft className="size-3.5" />
                        Volver al inicio de sesión
                    </button>
                </>
            )}
        </Form>
    );
}

// ─── Botones sociales (compartidos) ──────────────────────────────────────────

function SocialButtons() {
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
        function onMsg(e: MessageEvent) {
            if (e.origin !== window.location.origin) {
                return;
            }
            if (e.data?.type === 'oauth-success') {
                window.removeEventListener('message', onMsg);
                window.location.assign(oauthPostLoginPath(e.data.redirectTo, '/dashboard'));
            }
            if (e.data?.type === 'oauth-error') {
                window.removeEventListener('message', onMsg);
                window.location.reload();
            }
        }
        window.addEventListener('message', onMsg);
    }, []);

    return (
        <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => openSocialPopup('google')}
                className="flex cursor-pointer items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium shadow-xs transition-all duration-150 hover:shadow-sm active:scale-[0.98]"
                style={{ background: '#fff', border: '1.5px solid #e2e8f0', color: '#374151' }}>
                <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
            </button>
            <button type="button" onClick={() => openSocialPopup('github')}
                className="flex cursor-pointer items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium shadow-xs transition-all duration-150 hover:shadow-sm active:scale-[0.98]"
                style={{ background: '#24292f', border: '1.5px solid #24292f', color: '#fff' }}>
                <svg className="size-4 shrink-0 fill-white" viewBox="0 0 24 24" aria-hidden>
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
            </button>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export type FlipAuthCardProps = {
    initialView?: AuthView;
    canResetPassword?: boolean;
    canRegister?: boolean;
    status?: string;
};

export function FlipAuthCard({
    initialView = 'login',
    canResetPassword = true,
    canRegister = true,
    status,
}: FlipAuthCardProps) {
    const platform = usePlatform();

    // ── Estado de la animación ────────────────────────────────────────────────
    const [view, setView]   = useState<AuthView>(initialView);
    const [phase, setPhase] = useState<FlipPhase>('idle');
    const phaseRef          = useRef(phase);
    phaseRef.current        = phase;

    const flipTo = useCallback((target: AuthView) => {
        if (phaseRef.current !== 'idle') return;

        // 1. Giro de salida (0° → 90°)
        setPhase('out');

        setTimeout(() => {
            // 2. Swap instantáneo: cambia contenido y posiciona en -90°
            setView(target);
            setPhase('swap');

            // Dos rAF garantizan que el DOM registre el nuevo estado antes de transicionar
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // 3. Giro de entrada (-90° → 0°)
                    setPhase('in');
                    setTimeout(() => setPhase('idle'), 360);
                });
            });
        }, 340);
    }, []);

    // ── Estilo CSS del card según fase ────────────────────────────────────────
    const cardStyle: React.CSSProperties = {
        transform:
            phase === 'out'  ? 'perspective(1200px) rotateY(90deg)'
          : phase === 'swap' ? 'perspective(1200px) rotateY(-90deg)'
          :                    'perspective(1200px) rotateY(0deg)',
        opacity: (phase === 'out' || phase === 'swap') ? 0 : 1,
        transition:
            phase === 'out' ? 'transform 0.34s cubic-bezier(0.4,0,1,1), opacity 0.28s ease-in'
          : phase === 'swap' ? 'none'
          : phase === 'in'  ? 'transform 0.36s cubic-bezier(0,0,0.2,1), opacity 0.3s ease-out'
          : 'transform 0.36s cubic-bezier(0,0,0.2,1)',
    };

    const { title, description } = VIEW_META[view];
    const gradientBg = `linear-gradient(135deg, ${platform.login_bg_from} 0%, ${platform.login_bg_to} 60%, ${platform.color_accent} 100%)`;

    return (
        <div style={cardStyle}
            className="w-full overflow-hidden rounded-2xl shadow-2xl shadow-black/12">

            {/* ── Cabecera con gradiente ────────────────────────────────── */}
            <div className="relative overflow-hidden px-8 pb-10 pt-8" style={{ background: gradientBg }}>
                {/* Orbes decorativos */}
                <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-white opacity-[0.06] blur-xl" aria-hidden />
                <div className="pointer-events-none absolute -bottom-8 -left-8 size-24 rounded-full bg-white opacity-[0.05] blur-lg" aria-hidden />

                {/* Logo — solo móvil */}
                <Link href={home.url()} className="mb-5 flex items-center gap-2.5 lg:hidden">
                    <img
                        src={platform.icon_url}
                        alt={platform.app_name}
                        className={platformImgOnDarkClass(platform.icon_url, 'size-8 object-contain')}
                    />
                    <span className="font-semibold text-white/90">{platform.app_name}</span>
                </Link>

                {/* Ícono — solo desktop */}
                <div className="hidden size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm lg:flex">
                    <img
                        src={platform.icon_url}
                        alt={platform.app_name}
                        className={platformImgOnDarkClass(platform.icon_url, 'size-6 object-contain')}
                    />
                </div>

                {/* Título y descripción (cambian con el flip) */}
                <h2 className="mt-4 text-[1.65rem] font-bold tracking-tight text-white">{title}</h2>
                <p  className="mt-1.5 text-[0.875rem] leading-relaxed text-white/60">{description}</p>
            </div>

            {/* ── Cuerpo blanco ─────────────────────────────────────────── */}
            <div className="-mt-5 rounded-t-2xl px-8 pb-8 pt-7 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
                style={{ background: '#ffffff', color: '#0f172a' }}>

                {view === 'login' && (
                    <LoginForm
                        canResetPassword={canResetPassword}
                        canRegister={canRegister}
                        status={status}
                        color_primary={platform.color_primary}
                        color_accent={platform.color_accent}
                        flipTo={flipTo}
                    />
                )}
                {view === 'register' && (
                    <RegisterForm
                        color_primary={platform.color_primary}
                        color_accent={platform.color_accent}
                        flipTo={flipTo}
                    />
                )}
                {view === 'forgot' && (
                    <ForgotForm
                        color_primary={platform.color_primary}
                        color_accent={platform.color_accent}
                        flipTo={flipTo}
                    />
                )}
            </div>
        </div>
    );
}
