/**
 * admin/general-settings — Contacto, enlaces legales y redes sociales.
 */

import { Head, useForm } from '@inertiajs/react';
import { Globe2, Mail, Save, Settings2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { PageHeader } from '@/components/admin/page-header';
import { FormInput } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { edit as generalEdit, update as generalUpdate } from '@/routes/admin/general-settings';

interface GeneralSettingsPayload {
    contact_email: string | null;
    support_url: string | null;
    terms_url: string | null;
    privacy_url: string | null;
    social_facebook: string | null;
    social_instagram: string | null;
    social_linkedin: string | null;
    social_youtube: string | null;
}

interface Props {
    settings: GeneralSettingsPayload;
    can: { edit: boolean };
}

function SettingsSection({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/40 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
                {description ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                ) : null}
            </div>
            <div className="space-y-4 p-4 sm:p-5">{children}</div>
        </div>
    );
}

export default function GeneralSettingsIndex({ settings, can }: Props) {
    const { data, setData, post, processing, errors } = useForm<GeneralSettingsPayload>({
        ...settings,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(generalUpdate.url(), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Configuración general" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Configuración general"
                    description="Datos corporativos y enlaces públicos del sistema. No incluye credenciales de correo ni pasarelas."
                    icon={<Settings2 className="size-5 text-blue-600" />}
                    stats={[
                        {
                            label: 'Contacto',
                            value: '4',
                            icon: <Mail className="size-3.5" />,
                            color: 'blue',
                        },
                        {
                            label: 'Redes',
                            value: '4',
                            icon: <Globe2 className="size-3.5" />,
                            color: 'purple',
                        },
                    ]}
                />

                <form onSubmit={submit} className="flex flex-col gap-5">
                    <SettingsSection
                        title="Contacto y soporte"
                        description="Información mostrada al usuario final y usada en el pie de página."
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormInput
                                label="Correo de contacto"
                                type="email"
                                value={data.contact_email ?? ''}
                                onChange={(e) => setData('contact_email', e.target.value || null)}
                                disabled={!can.edit}
                                error={errors.contact_email}
                                hint="Ejemplo: soporte@tudominio.com"
                            />
                            <FormInput
                                label="URL de soporte"
                                value={data.support_url ?? ''}
                                onChange={(e) => setData('support_url', e.target.value || null)}
                                disabled={!can.edit}
                                error={errors.support_url}
                                hint="Página de ayuda, WhatsApp, portal de tickets, etc."
                            />
                        </div>
                    </SettingsSection>

                    <SettingsSection
                        title="Enlaces legales"
                        description="Términos y privacidad públicos para registro y footer."
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormInput
                                label="URL términos y condiciones"
                                value={data.terms_url ?? ''}
                                onChange={(e) => setData('terms_url', e.target.value || null)}
                                disabled={!can.edit}
                                error={errors.terms_url}
                            />
                            <FormInput
                                label="URL política de privacidad"
                                value={data.privacy_url ?? ''}
                                onChange={(e) => setData('privacy_url', e.target.value || null)}
                                disabled={!can.edit}
                                error={errors.privacy_url}
                            />
                        </div>
                    </SettingsSection>

                    <SettingsSection
                        title="Redes sociales"
                        description="Se muestran en zonas públicas cuando tengan valor."
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormInput
                                label="Facebook"
                                value={data.social_facebook ?? ''}
                                onChange={(e) => setData('social_facebook', e.target.value || null)}
                                disabled={!can.edit}
                                error={errors.social_facebook}
                            />
                            <FormInput
                                label="Instagram"
                                value={data.social_instagram ?? ''}
                                onChange={(e) => setData('social_instagram', e.target.value || null)}
                                disabled={!can.edit}
                                error={errors.social_instagram}
                            />
                            <FormInput
                                label="LinkedIn"
                                value={data.social_linkedin ?? ''}
                                onChange={(e) => setData('social_linkedin', e.target.value || null)}
                                disabled={!can.edit}
                                error={errors.social_linkedin}
                            />
                            <FormInput
                                label="YouTube"
                                value={data.social_youtube ?? ''}
                                onChange={(e) => setData('social_youtube', e.target.value || null)}
                                disabled={!can.edit}
                                error={errors.social_youtube}
                            />
                        </div>
                    </SettingsSection>

                    {can.edit ? (
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="gap-2 rounded-xl px-6 font-semibold text-white shadow-sm"
                                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
                            >
                                {processing ? (
                                    <>
                                        <Spinner className="size-4" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="size-4" />
                                        Guardar cambios
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <p className="text-center text-sm text-muted-foreground">
                            Solo lectura: no tienes permiso para editar la configuración general.
                        </p>
                    )}
                </form>
            </div>
        </>
    );
}

GeneralSettingsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'General', href: generalEdit.url() },
    ],
};
