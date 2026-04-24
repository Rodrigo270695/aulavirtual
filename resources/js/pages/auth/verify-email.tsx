import { Form, Head } from '@inertiajs/react';
import { Mail, RefreshCw } from 'lucide-react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { usePlatform } from '@/hooks/use-platform';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

const MUTED_STYLE: React.CSSProperties = { color: '#6b7280' };

export default function VerifyEmail({ status }: { status?: string }) {
    const { app_name, color_primary, color_accent } = usePlatform();

    return (
        <>
            <Head title={`Verificar correo · ${app_name}`} />

            {/* Ícono decorativo */}
            <div className="mb-5 flex justify-center">
                <div
                    className="flex size-14 items-center justify-center rounded-2xl"
                    style={{ background: `${color_primary}15` }}
                >
                    <Mail className="size-7" style={{ color: color_primary }} />
                </div>
            </div>

            {/* Aviso de éxito */}
            {status === 'verification-link-sent' && (
                <div
                    style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}
                    className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
                >
                    <span className="size-2 shrink-0 rounded-full bg-emerald-400" />
                    Se ha enviado un nuevo enlace de verificación a tu correo electrónico.
                </div>
            )}

            <Form {...send.form()} className="flex flex-col gap-4">
                {({ processing }) => (
                    <>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="group h-11 w-full cursor-pointer gap-2 rounded-xl border-0
                                       text-[0.9rem] font-semibold text-white shadow-md
                                       transition-all duration-200 hover:opacity-90 hover:shadow-lg
                                       active:scale-[0.983]"
                            style={{ background: `linear-gradient(135deg, ${color_primary} 0%, ${color_accent} 100%)` }}
                        >
                            {processing ? (
                                <><Spinner className="size-4" /><span>Enviando…</span></>
                            ) : (
                                <><RefreshCw className="size-4" /><span>Reenviar correo de verificación</span></>
                            )}
                        </Button>

                        <p className="text-center text-sm" style={MUTED_STYLE}>
                            ¿Quieres usar otra cuenta?{' '}
                            <TextLink
                                href={logout()}
                                className="cursor-pointer font-semibold transition-colors"
                                style={{ color: color_primary }}
                            >
                                Cerrar sesión
                            </TextLink>
                        </p>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verifica tu correo',
    description: 'Haz clic en el enlace que te enviamos para activar tu cuenta.',
};
