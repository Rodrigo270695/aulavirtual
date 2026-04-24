/**
 * RoleFormModal — crea o edita el nombre de un rol.
 *
 * Los permisos se gestionan por separado desde el botón
 * "Permisos" en la tabla (RolePermissionsModal).
 */

import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { FormInput } from '@/components/form';
import { Modal } from '@/components/ui/modal';
import * as rolesRoute from '@/routes/admin/roles';
import type { Role } from '@/types';

interface Props {
    open: boolean;
    onClose: () => void;
    role: Role | null;
}

interface FormData {
    name: string;
}

export function RoleFormModal({ open, onClose, role }: Props) {
    const isEditing = role !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        name: '',
    });

    useEffect(() => {
        if (open) {
            setData('name', role?.name ?? '');
            clearErrors();
        }
    }, [open, role]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = { onSuccess: handleClose, preserveScroll: true };

        if (isEditing) {
            put(rolesRoute.update.url(role.id), options);
        } else {
            post(rolesRoute.store.url(), options);
        }
    };

    const footer = (
        <div className="flex w-full items-center justify-end gap-2">
            <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
                Cancelar
            </button>
            <button
                form="role-form"
                type="submit"
                disabled={processing}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
            >
                {processing ? 'Guardando...' : isEditing ? 'Actualizar rol' : 'Crear rol'}
            </button>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isEditing ? `Editar: ${role?.name}` : 'Nuevo rol'}
            description={
                isEditing
                    ? 'Cambia el nombre del rol. Los permisos se gestionan desde el botón de permisos en la tabla.'
                    : 'Define el nombre del rol. Podrás asignar permisos después desde la tabla.'
            }
            size="sm"
            footer={footer}
        >
            <form id="role-form" onSubmit={handleSubmit}>
                <FormInput
                    label="Nombre del rol"
                    required
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="ej. instructor, moderador..."
                    autoFocus
                    error={errors.name}
                    hint="Solo letras, números y guiones. Sin espacios al inicio ni al final."
                />
            </form>
        </Modal>
    );
}
