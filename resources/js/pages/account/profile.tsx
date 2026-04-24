import { Link, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { FormInput, FormSelect } from '@/components/form';
import { MarketplaceShell } from '@/components/marketplace/marketplace-shell';
import { Button } from '@/components/ui/button';
import { update } from '@/routes/profile';
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

export default function AccountProfile({
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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sincronizar tras guardar
    }, [auth.user.updated_at]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(update.url(), { preserveScroll: true });
    };

    return (
        <MarketplaceShell title="Mi perfil">
            <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Completa tu perfil</h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Datos de contacto e identidad. Puedes actualizarlos cuando quieras.
                    </p>

                    <form onSubmit={submit} className="mt-8 space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-sm font-semibold text-slate-800">Datos básicos</h2>
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
                                <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-900">
                                    Tu correo aún no está verificado.{' '}
                                    <Link
                                        href={send()}
                                        as="button"
                                        className="font-medium underline underline-offset-2 hover:text-amber-950"
                                    >
                                        Reenviar enlace
                                    </Link>
                                    {status === 'verification-link-sent' && (
                                        <span className="mt-2 block text-emerald-700">
                                            Se ha enviado un nuevo enlace a tu correo.
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 border-t border-slate-200 pt-8">
                            <h2 className="text-sm font-semibold text-slate-800">Identidad y contacto</h2>
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
                                    placeholder="Ej. 12345678"
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
                                    hint="Identificador IANA."
                                    error={errors.timezone}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
                            <Button type="submit" disabled={processing}>
                                Guardar cambios
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </MarketplaceShell>
    );
}
