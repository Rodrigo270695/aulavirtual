import { Form, Head } from '@inertiajs/react';
import { ArrowRight, Lock } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { usePlatform } from '@/hooks/use-platform';
import { store } from '@/routes/password/confirm';

const INPUT_STYLE: React.CSSProperties = {
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    color: '#0f172a',
};
const LABEL_STYLE: React.CSSProperties = { color: '#374151', fontWeight: 600, fontSize: '0.8125rem' };

export default function ConfirmPassword() {
    const { app_name, color_primary, color_accent } = usePlatform();

    return (
        <>
            <Head title={`Confirmar contraseña · ${app_name}`} />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-1.5">
                            <Label htmlFor="password" style={LABEL_STYLE}>
                                Contraseña actual
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
                                    autoComplete="current-password"
                                    placeholder="Tu contraseña actual"
                                    style={INPUT_STYLE}
                                    className="h-11 rounded-xl pl-10 pr-11 text-sm transition-all duration-150
                                               placeholder:text-slate-400
                                               focus-visible:ring-[3px] focus-visible:ring-blue-500/20
                                               focus-visible:border-blue-500/60"
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        <Button
                            type="submit"
                            tabIndex={2}
                            disabled={processing}
                            data-test="confirm-password-button"
                            className="group mt-2 h-11 w-full cursor-pointer gap-2 rounded-xl border-0
                                       text-[0.9rem] font-semibold text-white shadow-md
                                       transition-all duration-200 hover:opacity-90 hover:shadow-lg
                                       active:scale-[0.983]"
                            style={{ background: `linear-gradient(135deg, ${color_primary} 0%, ${color_accent} 100%)` }}
                        >
                            {processing ? (
                                <><Spinner className="size-4" /><span>Verificando…</span></>
                            ) : (
                                <>
                                    <span>Confirmar contraseña</span>
                                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.5} />
                                </>
                            )}
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Confirma tu identidad',
    description: 'Esta es una zona segura. Ingresa tu contraseña para continuar.',
};
