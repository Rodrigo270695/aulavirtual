/**
 * UserFormModal — crea o edita un usuario del panel admin.
 *
 * Misma estructura visual que RoleFormModal: Modal + footer con gradiente azul,
 * botones Cancelar / primario, FormInput y componentes del design system.
 */

import { useForm } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';
import { FormComboboxMulti, FormInput, FormPasswordInput, FormSwitch } from '@/components/form';
import { Modal } from '@/components/ui/modal';
import * as usersRoute from '@/routes/admin/users';
import type { AdminUser, RoleOption } from '@/types';

interface Props {
    open: boolean;
    onClose: () => void;
    user: AdminUser | null;
    roleOptions: RoleOption[];
}

interface FormData {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    is_active: boolean;
    roles: number[];
}

export function UserFormModal({ open, onClose, user, roleOptions }: Props) {
    const isEditing = user !== null;

    const rolesSortedAsc = useMemo(
        () =>
            [...roleOptions].sort((a, b) =>
                a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
            ),
        [roleOptions],
    );

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        is_active: true,
        roles: [],
    });

    useEffect(() => {
        if (open) {
            if (user) {
                setData({
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    password: '',
                    password_confirmation: '',
                    is_active: user.is_active,
                    roles: user.roles.map((r) => r.id),
                });
            } else {
                setData({
                    first_name: '',
                    last_name: '',
                    email: '',
                    password: '',
                    password_confirmation: '',
                    is_active: true,
                    roles: [],
                });
            }

            clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo open + user (patrón useForm / Inertia)
    }, [open, user]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = { onSuccess: handleClose, preserveScroll: true };

        if (isEditing && user) {
            put(usersRoute.update.url({ user: user.id }), options);
        } else {
            post(usersRoute.store.url(), options);
        }
    };

    const rolesError =
        errors.roles ??
        Object.entries(errors).find(([k]) => k.startsWith('roles.'))?.[1];

    const footer = (
        <div className="flex w-full flex-wrap items-center justify-end gap-3">
            <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-slate-300/90 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50"
            >
                Cancelar
            </button>
            <button
                form="user-form"
                type="submit"
                disabled={processing}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
            >
                {processing ? 'Guardando...' : isEditing ? 'Actualizar usuario' : 'Crear usuario'}
            </button>
        </div>
    );

    const titleName = user ? `${user.first_name} ${user.last_name}`.trim() : '';

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isEditing ? `Editar: ${titleName || user?.email}` : 'Nuevo usuario'}
            description={
                isEditing
                    ? 'Modifica los datos del usuario, la contraseña y los roles. La identidad y el contacto los gestiona cada usuario en Configuración → Perfil.'
                    : 'Registra la cuenta y los roles. Cada usuario completará documento, teléfono y zona horaria en su perfil.'
            }
            size="xl"
            footer={footer}
        >
            <form id="user-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormInput
                        label="Nombre"
                        required
                        value={data.first_name}
                        onChange={(e) => setData('first_name', e.target.value)}
                        placeholder="Nombre(s)"
                        autoFocus
                        error={errors.first_name}
                    />
                    <FormInput
                        label="Apellido"
                        required
                        value={data.last_name}
                        onChange={(e) => setData('last_name', e.target.value)}
                        placeholder="Apellido(s)"
                        error={errors.last_name}
                    />
                </div>

                <FormInput
                    label="Correo electrónico"
                    required
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="correo@ejemplo.com"
                    error={errors.email}
                    hint="El inicio de sesión en la plataforma es siempre con este correo."
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormPasswordInput
                        label={isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                        required={!isEditing}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder={isEditing ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres'}
                        autoComplete="new-password"
                        error={errors.password}
                    />
                    <FormPasswordInput
                        label="Confirmar contraseña"
                        required={!isEditing}
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        placeholder="Repite la contraseña"
                        autoComplete="new-password"
                        error={errors.password_confirmation}
                    />
                </div>

                {rolesSortedAsc.length > 0 && (
                    <div className="border-t border-slate-200/90 pt-3">
                        <FormComboboxMulti
                            label="Roles"
                            id="user-roles-combobox"
                            options={rolesSortedAsc.map((r) => ({
                                value: String(r.id),
                                label: r.name,
                            }))}
                            value={data.roles.map(String)}
                            onValueChange={(vals) =>
                                setData(
                                    'roles',
                                    vals.map((v) => parseInt(v, 10)).filter((n) => !Number.isNaN(n)),
                                )
                            }
                            triggerPlaceholder="Seleccionar roles…"
                            searchPlaceholder="Buscar rol…"
                            emptyText="Ningún rol coincide."
                            hint="Abre el listado, busca y marca los roles. Puedes elegir varios. Un usuario sin roles solo verá lo que permita el sistema."
                            error={rolesError}
                        />
                    </div>
                )}

                <FormSwitch
                    label="Estado de la cuenta"
                    checked={data.is_active}
                    onCheckedChange={(v) => setData('is_active', v)}
                    description={data.is_active ? 'La cuenta puede iniciar sesión.' : 'La cuenta está desactivada.'}
                    hint="Desactivar impide el acceso sin borrar el usuario."
                />
            </form>
        </Modal>
    );
}
