import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { FormInput, FormSelect } from '@/components/form';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { edit, update } from '@/routes/profile';
import { send } from '@/routes/verification';

const DOCUMENT_TYPE_NONE = 'none';

const DOCUMENT_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: DOCUMENT_TYPE_NONE, label: 'Sin especificar' },
    { value: 'dni', label: 'DNI' },
    { value: 'ce', label: 'Carnet de extranjería (CE)' },
    { value: 'passport', label: 'Pasaporte' },
    { value: 'cedula', label: 'Cédula' },
    { value: 'ruc', label: 'RUC' },
];

interface ProfileFormData {
    first_name: string;
    last_name: string;
    email: string;
    document_type: string;
    document_number: string;
    phone_country_code: string;
    phone_number: string;
    country_code: string;
    timezone: string;
}

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;

    const { data, setData, patch, processing, errors, reset } = useForm<ProfileFormData>({
        first_name: auth.user.first_name,
        last_name: auth.user.last_name,
        email: auth.user.email,
        document_type: auth.user.document_type ?? DOCUMENT_TYPE_NONE,
        document_number: auth.user.document_number ?? '',
        phone_country_code: auth.user.phone_country_code ?? '',
        phone_number: auth.user.phone_number ?? '',
        country_code: auth.user.country_code ?? '',
        timezone: auth.user.timezone ?? 'America/Lima',
    });

    useEffect(() => {
        reset({
            first_name: auth.user.first_name,
            last_name: auth.user.last_name,
            email: auth.user.email,
            document_type: auth.user.document_type ?? DOCUMENT_TYPE_NONE,
            document_number: auth.user.document_number ?? '',
            phone_country_code: auth.user.phone_country_code ?? '',
            phone_number: auth.user.phone_number ?? '',
            country_code: auth.user.country_code ?? '',
            timezone: auth.user.timezone ?? 'America/Lima',
        });
        // Sincronizar tras guardar (Inertia actualiza auth.user.updated_at); no incluir todo auth.user para no pisar ediciones locales en cada render.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- ver comentario
    }, [auth.user.updated_at]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(update.url(), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Perfil" />

            <h1 className="sr-only">Configuración del perfil</h1>

            <form onSubmit={submit} className="space-y-10">
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Datos básicos"
                        description="Nombre, correo y verificación de la cuenta"
                    />

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormInput
                                label="Nombres"
                                required
                                id="first_name"
                                name="first_name"
                                value={data.first_name}
                                onChange={(e) => setData('first_name', e.target.value)}
                                autoComplete="given-name"
                                placeholder="Nombres"
                                error={errors.first_name}
                            />
                            <FormInput
                                label="Apellidos"
                                required
                                id="last_name"
                                name="last_name"
                                value={data.last_name}
                                onChange={(e) => setData('last_name', e.target.value)}
                                autoComplete="family-name"
                                placeholder="Apellidos"
                                error={errors.last_name}
                            />
                        </div>

                        <FormInput
                            label="Correo electrónico"
                            required
                            id="email"
                            name="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="username"
                            placeholder="correo@ejemplo.com"
                            error={errors.email}
                        />

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div>
                                <p className="-mt-2 text-sm text-muted-foreground">
                                    Tu correo aún no está verificado.{' '}
                                    <Link
                                        href={send()}
                                        as="button"
                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                    >
                                        Pulsa aquí para reenviar el enlace de verificación.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        Se ha enviado un nuevo enlace de verificación a tu correo.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6 border-t border-border pt-10">
                    <Heading
                        variant="small"
                        title="Identidad y contacto"
                        description="Documento, teléfono, país y zona horaria. Puedes completarlos o actualizarlos cuando quieras."
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormSelect
                            label="Tipo de documento"
                            value={data.document_type}
                            onValueChange={(v) => setData('document_type', v)}
                            options={DOCUMENT_TYPE_OPTIONS}
                            placeholder="Sin especificar"
                            error={errors.document_type}
                        />
                        <FormInput
                            label="Número de documento"
                            id="document_number"
                            name="document_number"
                            value={data.document_number}
                            onChange={(e) => setData('document_number', e.target.value)}
                            placeholder="Ej. 12345678 o pasaporte"
                            error={errors.document_number}
                        />
                        <FormInput
                            label="Prefijo teléfono"
                            id="phone_country_code"
                            name="phone_country_code"
                            value={data.phone_country_code}
                            onChange={(e) => setData('phone_country_code', e.target.value)}
                            placeholder="Ej. +51"
                            hint="Código internacional."
                            error={errors.phone_country_code}
                        />
                        <FormInput
                            label="Número de celular"
                            id="phone_number"
                            name="phone_number"
                            value={data.phone_number}
                            onChange={(e) => setData('phone_number', e.target.value)}
                            placeholder="Solo dígitos locales"
                            error={errors.phone_number}
                        />
                        <FormInput
                            label="País (ISO)"
                            id="country_code"
                            name="country_code"
                            value={data.country_code}
                            onChange={(e) =>
                                setData('country_code', e.target.value.toUpperCase())
                            }
                            placeholder="PE, VE, CO…"
                            maxLength={2}
                            hint="Dos letras ISO 3166-1."
                            error={errors.country_code}
                        />
                        <FormInput
                            label="Zona horaria"
                            id="timezone"
                            name="timezone"
                            value={data.timezone}
                            onChange={(e) => setData('timezone', e.target.value)}
                            placeholder="America/Lima"
                            hint="Identificador IANA, por ejemplo America/Lima."
                            error={errors.timezone}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
                    <Button disabled={processing} data-test="update-profile-button" type="submit">
                        Guardar perfil
                    </Button>
                </div>
            </form>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Perfil',
            href: edit(),
        },
    ],
};
