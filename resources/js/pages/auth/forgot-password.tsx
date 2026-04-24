import { Form, Head } from '@inertiajs/react';
import { ArrowRight, Mail } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { usePlatform } from '@/hooks/use-platform';
import { login } from '@/routes';
import { email } from '@/routes/password';

const INPUT_STYLE: React.CSSProperties = {
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    color: '#0f172a',
};
const LABEL_STYLE: React.CSSProperties = { color: '#374151', fontWeight: 600, fontSize: '0.8125rem' };
const MUTED_STYLE: React.CSSProperties  = { color: '#6b7280' };

export default function ForgotPassword({ status }: { status?: string }) {
    const { app_name, color_primary, color_accent } = usePlatform();

    return (
        <>
            <Head title={`Recuperar contraseña · ${app_name}`} />

            <Form {...email.form()} className="flex flex-col gap-4">
                {({ processing, errors }) => (
                    <>
                        {/* Estado de éxito */}
                        {status && (
                            <div
                                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}
                                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
                            >
                                <span className="size-2 shrink-0 rounded-full bg-emerald-400" />
                                {status}
                            </div>
                        )}

                        {/* Email */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="email" style={LABEL_STYLE}>
                                Correo electrónico
                            </Label>
                            <div className="relative">
                                <Mail
                                    className="pointer-events-none absolute left-3.5 top-1/2 size-[15px] -translate-y-1/2"
                                    style={{ color: '#94a3b8' }}
                                />
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
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

                        {/* Botón */}
                        <Button
                            type="submit"
                            disabled={processing}
                            data-test="email-password-reset-link-button"
                            className="group mt-2 h-11 w-full cursor-pointer gap-2 rounded-xl border-0
                                       text-[0.9rem] font-semibold text-white shadow-md
                                       transition-all duration-200 hover:opacity-90 hover:shadow-lg
                                       active:scale-[0.983]"
                            style={{ background: `linear-gradient(135deg, ${color_primary} 0%, ${color_accent} 100%)` }}
                        >
                            {processing ? (
                                <><Spinner className="size-4" /><span>Enviando…</span></>
                            ) : (
                                <>
                                    <span>Enviar enlace de recuperación</span>
                                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.5} />
                                </>
                            )}
                        </Button>

                        {/* Volver al login */}
                        <p className="text-center text-sm" style={MUTED_STYLE}>
                            ¿Recordaste tu contraseña?{' '}
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

ForgotPassword.layout = {
    title: 'Recuperar contraseña',
    description: 'Ingresa tu correo y te enviamos un enlace para restablecerla.',
};
