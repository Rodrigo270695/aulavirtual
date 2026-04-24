import { Form, Head } from '@inertiajs/react';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { usePlatform } from '@/hooks/use-platform';
import { login } from '@/routes';
import { update } from '@/routes/password';

const INPUT_STYLE: React.CSSProperties = {
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    color: '#0f172a',
};
const INPUT_READONLY_STYLE: React.CSSProperties = {
    background: '#f1f5f9',
    border: '1.5px solid #e2e8f0',
    color: '#64748b',
};
const LABEL_STYLE: React.CSSProperties = { color: '#374151', fontWeight: 600, fontSize: '0.8125rem' };
const MUTED_STYLE: React.CSSProperties  = { color: '#6b7280' };

type Props = {
    token: string;
    email: string;
};

export default function ResetPassword({ token, email }: Props) {
    const { app_name, color_primary, color_accent } = usePlatform();

    return (
        <>
            <Head title={`Nueva contraseña · ${app_name}`} />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <>
                        {/* Email (solo lectura — muestra a quién pertenece la cuenta) */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="email" style={LABEL_STYLE}>
                                Correo electrónico
                            </Label>
                            <div className="relative">
                                <Mail
                                    className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[15px] -translate-y-1/2"
                                    style={{ color: '#94a3b8' }}
                                />
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    readOnly
                                    tabIndex={-1}
                                    style={INPUT_READONLY_STYLE}
                                    className="h-11 cursor-not-allowed rounded-xl pl-10 pr-4 text-sm"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        {/* Nueva contraseña */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="password" style={LABEL_STYLE}>
                                Nueva contraseña
                            </Label>
                            <div className="relative">
                                <Lock
                                    className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[15px] -translate-y-1/2"
                                    style={{ color: '#94a3b8' }}
                                />
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    autoFocus
                                    tabIndex={1}
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
                            <Label htmlFor="password_confirmation" style={LABEL_STYLE}>
                                Confirmar contraseña
                            </Label>
                            <div className="relative">
                                <Lock
                                    className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[15px] -translate-y-1/2"
                                    style={{ color: '#94a3b8' }}
                                />
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    required
                                    tabIndex={2}
                                    autoComplete="new-password"
                                    placeholder="Repite tu nueva contraseña"
                                    style={INPUT_STYLE}
                                    className="h-11 rounded-xl pl-10 pr-11 text-sm transition-all duration-150
                                               placeholder:text-slate-400
                                               focus-visible:ring-[3px] focus-visible:ring-blue-500/20
                                               focus-visible:border-blue-500/60"
                                />
                            </div>
                            <InputError message={errors.password_confirmation} />
                        </div>

                        {/* Botón */}
                        <Button
                            type="submit"
                            tabIndex={3}
                            disabled={processing}
                            data-test="reset-password-button"
                            className="group mt-2 h-11 w-full cursor-pointer gap-2 rounded-xl border-0
                                       text-[0.9rem] font-semibold text-white shadow-md
                                       transition-all duration-200 hover:opacity-90 hover:shadow-lg
                                       active:scale-[0.983]"
                            style={{ background: `linear-gradient(135deg, ${color_primary} 0%, ${color_accent} 100%)` }}
                        >
                            {processing ? (
                                <><Spinner className="size-4" /><span>Guardando…</span></>
                            ) : (
                                <>
                                    <span>Restablecer contraseña</span>
                                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.5} />
                                </>
                            )}
                        </Button>

                        {/* Volver al login */}
                        <p className="text-center text-sm" style={MUTED_STYLE}>
                            ¿Ya la recuerdas?{' '}
                            <TextLink
                                href={login()}
                                className="cursor-pointer font-semibold transition-colors"
                                style={{ color: color_primary }}
                            >
                                Inicia sesión
                            </TextLink>
                        </p>
                    </>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Nueva contraseña',
    description: 'Elige una contraseña segura para tu cuenta.',
};
