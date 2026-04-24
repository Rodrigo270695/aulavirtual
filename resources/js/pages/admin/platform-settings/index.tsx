/**
 * admin/platform-settings — Configuración global (vista plana, sin tabla).
 */

import { Head, useForm } from '@inertiajs/react';
import { ImageIcon, Palette, Save } from 'lucide-react';
import type { FormEvent } from 'react';
import { ImageUploadField } from '@/components/admin/image-upload-field';
import { PageHeader } from '@/components/admin/page-header';
import { FormInput, FormTextarea } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { edit as platformEdit, update as platformUpdate } from '@/routes/admin/platform-settings';
import { cn } from '@/lib/utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SettingsPayload {
    app_name: string;
    app_tagline: string | null;
    color_primary: string;
    color_secondary: string;
    color_accent: string;
    login_bg_from: string;
    login_bg_to: string;
    login_tagline: string | null;
    contact_email: string | null;
    support_url: string | null;
    terms_url: string | null;
    privacy_url: string | null;
    social_facebook: string | null;
    social_instagram: string | null;
    social_linkedin: string | null;
    social_youtube: string | null;
}

interface MediaPreview {
    logo_url: string;
    icon_url: string;
    favicon_url: string;
}

interface ColorDefaults {
    color_primary: string;
    color_secondary: string;
    color_accent: string;
    login_bg_from: string;
    login_bg_to: string;
}

interface Props {
    settings: SettingsPayload;
    media: MediaPreview;
    defaults: ColorDefaults;
    can: { edit: boolean };
}

type FormData = SettingsPayload & {
    logo: File | null;
    icon: File | null;
    favicon: File | null;
};

// ─── Bloques de sección (mismo contenedor que DataTable / cards admin) ─────────

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

function HexColorRow({
    label,
    value,
    onChange,
    error,
    disabled,
    hint,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    disabled?: boolean;
    hint?: string;
}) {
    const safe = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#1a56db';

    return (
        <div className="flex flex-col">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
                <div className="min-w-0 flex-1">
                    <FormInput
                        label={label}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="#1a56db"
                        disabled={disabled}
                        error={error}
                        autoComplete="off"
                    />
                </div>
                <div className="flex shrink-0">
                    <input
                        type="color"
                        aria-label={`Selector ${label}`}
                        value={safe}
                        disabled={disabled}
                        onChange={(e) => onChange(e.target.value)}
                        className={cn(
                            'h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white',
                            disabled && 'cursor-not-allowed opacity-50',
                        )}
                    />
                </div>
            </div>
            {hint && !error ? (
                <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
            ) : null}
        </div>
    );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function PlatformSettingsIndex({ settings, media, defaults, can }: Props) {
    const { data, setData, post, processing, errors, progress } = useForm<FormData>({
        ...settings,
        logo: null,
        icon: null,
        favicon: null,
    });

    const logoPreview = data.logo ? URL.createObjectURL(data.logo) : media.logo_url;
    const iconPreview = data.icon ? URL.createObjectURL(data.icon) : media.icon_url;
    const faviconPreview = data.favicon ? URL.createObjectURL(data.favicon) : media.favicon_url;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        // POST (no PUT real): con multipart, PHP suele no rellenar la petición si el verbo es PUT.
        post(platformUpdate.url(), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const applyColorDefaults = () => {
        setData((prev) => ({
            ...prev,
            color_primary: defaults.color_primary,
            color_secondary: defaults.color_secondary,
            color_accent: defaults.color_accent,
            login_bg_from: defaults.login_bg_from,
            login_bg_to: defaults.login_bg_to,
        }));
    };

    return (
        <>
            <Head title="Configuración de plataforma" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Configuración de plataforma"
                    description="Marca, colores (alineados con la paleta Orvae de app.css), imágenes y textos del login."
                    icon={<Palette className="size-5 text-blue-600" />}
                    stats={[
                        {
                            label: 'Colores',
                            value: '5',
                            icon: <Palette className="size-3.5" />,
                            color: 'blue',
                        },
                        {
                            label: 'Imágenes',
                            value: '3',
                            icon: <ImageIcon className="size-3.5" />,
                            color: 'purple',
                        },
                    ]}
                    actions={
                        can.edit ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-slate-200"
                                onClick={applyColorDefaults}
                            >
                                Restaurar colores por defecto
                            </Button>
                        ) : undefined
                    }
                />

                <form onSubmit={submit} className="flex flex-col gap-5">
                    <SettingsSection
                        title="Identidad"
                        description="Nombre público y frase corta (welcome, login, meta)."
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormInput
                                label="Nombre de la aplicación"
                                required
                                value={data.app_name}
                                onChange={(e) => setData('app_name', e.target.value)}
                                disabled={!can.edit}
                                error={errors.app_name}
                            />
                            <FormInput
                                label="Eslogan"
                                value={data.app_tagline ?? ''}
                                onChange={(e) => setData('app_tagline', e.target.value || null)}
                                disabled={!can.edit}
                                error={errors.app_tagline}
                                hint="Texto breve bajo el nombre en marketing."
                            />
                        </div>
                    </SettingsSection>

                    <SettingsSection
                        title="Paleta de marca"
                        description="Valores HEX como en la migración y en app.css (#1a56db, #1e3a8a, #35a0ff, #0d1b6e)."
                    >
                        <div className="grid gap-4 lg:grid-cols-2">
                            <HexColorRow
                                label="Color primario"
                                value={data.color_primary}
                                onChange={(v) => setData('color_primary', v)}
                                error={errors.color_primary}
                                disabled={!can.edit}
                                hint="Botones y acentos principales."
                            />
                            <HexColorRow
                                label="Color secundario"
                                value={data.color_secondary}
                                onChange={(v) => setData('color_secondary', v)}
                                error={errors.color_secondary}
                                disabled={!can.edit}
                                hint="Sidebar y fondos oscuros de marca."
                            />
                            <HexColorRow
                                label="Color de resalte"
                                value={data.color_accent}
                                onChange={(v) => setData('color_accent', v)}
                                error={errors.color_accent}
                                disabled={!can.edit}
                                hint="Hover y brillos."
                            />
                        </div>
                    </SettingsSection>

                    <SettingsSection title="Login" description="Gradiente del panel izquierdo y texto opcional.">
                        <div className="grid gap-4 lg:grid-cols-2">
                            <HexColorRow
                                label="Gradiente login — inicio"
                                value={data.login_bg_from}
                                onChange={(v) => setData('login_bg_from', v)}
                                error={errors.login_bg_from}
                                disabled={!can.edit}
                            />
                            <HexColorRow
                                label="Gradiente login — fin"
                                value={data.login_bg_to}
                                onChange={(v) => setData('login_bg_to', v)}
                                error={errors.login_bg_to}
                                disabled={!can.edit}
                            />
                        </div>
                        <FormTextarea
                            label="Texto marketing (login)"
                            rows={3}
                            value={data.login_tagline ?? ''}
                            onChange={(e) => setData('login_tagline', e.target.value || null)}
                            disabled={!can.edit}
                            error={errors.login_tagline}
                            hint="Párrafo en el panel decorativo del login."
                        />
                    </SettingsSection>

                    <SettingsSection
                        title="Imágenes"
                        description="PNG o SVG. Si no subes archivo, se mantienen las actuales."
                    >
                        <ImageUploadField
                            label="Logo completo"
                            hint="Sidebar expandido y material de marca."
                            previewUrl={logoPreview}
                            disabled={!can.edit}
                            file={data.logo}
                            onFileChange={(f) => setData('logo', f)}
                            error={errors.logo}
                        />
                        <ImageUploadField
                            label="Ícono"
                            hint="Cuadrado; sidebar colapsado y usos pequeños."
                            previewUrl={iconPreview}
                            disabled={!can.edit}
                            file={data.icon}
                            onFileChange={(f) => setData('icon', f)}
                            error={errors.icon}
                        />
                        <ImageUploadField
                            label="Favicon"
                            hint="Pestaña del navegador (.png o .ico)."
                            previewUrl={faviconPreview}
                            disabled={!can.edit}
                            file={data.favicon}
                            onFileChange={(f) => setData('favicon', f)}
                            error={errors.favicon}
                            footnote="PNG, ICO, SVG. Tamaño pequeño recomendado."
                        />
                    </SettingsSection>

                    <SettingsSection title="Enlaces y contacto">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormInput
                                label="Correo de contacto"
                                type="email"
                                value={data.contact_email ?? ''}
                                onChange={(e) => setData('contact_email', e.target.value || null)}
                                disabled={!can.edit}
                                error={errors.contact_email}
                            />
                            <FormInput
                                label="URL de soporte"
                                value={data.support_url ?? ''}
                                onChange={(e) => setData('support_url', e.target.value || null)}
                                disabled={!can.edit}
                                error={errors.support_url}
                            />
                            <FormInput
                                label="URL términos"
                                value={data.terms_url ?? ''}
                                onChange={(e) => setData('terms_url', e.target.value || null)}
                                disabled={!can.edit}
                                error={errors.terms_url}
                            />
                            <FormInput
                                label="URL privacidad"
                                value={data.privacy_url ?? ''}
                                onChange={(e) => setData('privacy_url', e.target.value || null)}
                                disabled={!can.edit}
                                error={errors.privacy_url}
                            />
                        </div>
                    </SettingsSection>

                    <SettingsSection title="Redes sociales">
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
                                        Guardando…
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
                            Solo lectura: no tienes permiso para editar la configuración de plataforma.
                        </p>
                    )}

                    {progress && (
                        <p className="text-center text-xs text-slate-500">
                            Subiendo archivos… {Math.round(progress.percentage ?? 0)}%
                        </p>
                    )}
                </form>
            </div>
        </>
    );
}

PlatformSettingsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Plataforma', href: platformEdit.url() },
    ],
};
