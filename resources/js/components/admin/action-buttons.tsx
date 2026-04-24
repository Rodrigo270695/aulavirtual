/**
 * ActionButtons — botones de acción para filas de tabla y cards.
 *
 * variant="icon"    → icono solo, compacto (desktop / tabla)
 * variant="labeled" → icono + etiqueta, táctil (móvil / card)
 *
 * Solo renderiza los botones para los que el usuario tiene permiso.
 */

import { Eye, FileStack, KeyRound, Layers, Pencil, Trash2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonsProps {
    onView?:         () => void;
    onFicha?:        () => void;
    onModulos?:      () => void;
    onMatriculas?:   () => void;
    onEdit?:         () => void;
    onDelete?:       () => void;
    onPermissions?:  () => void;
    canView?:        boolean;
    canFicha?:       boolean;
    canModulos?:     boolean;
    canMatriculas?:  boolean;
    canEdit?:        boolean;
    canDelete?:      boolean;
    canPermissions?: boolean;
    /** "icon" → solo icono (tabla desktop) · "labeled" → icono + texto (card móvil) */
    variant?:        'icon' | 'labeled';
    className?:      string;
}

export function ActionButtons({
    onView,
    onFicha,
    onModulos,
    onMatriculas,
    onEdit,
    onDelete,
    onPermissions,
    canView        = true,
    canFicha       = false,
    canModulos     = false,
    canMatriculas  = false,
    canEdit        = true,
    canDelete      = true,
    canPermissions = false,
    variant        = 'icon',
    className,
}: ActionButtonsProps) {
    if (!canView && !canFicha && !canModulos && !canMatriculas && !canEdit && !canDelete && !canPermissions) {
        return null;
    }

    const isLabeled = variant === 'labeled';

    return (
        <div className={cn('flex flex-wrap items-center gap-1', isLabeled && 'gap-1.5', className)}>
            {canView && onView && (
                <ActionBtn
                    onClick={onView}
                    title="Ver detalle"
                    label="Ver"
                    colorClass="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    variant={variant}
                >
                    <Eye className={cn('shrink-0', isLabeled ? 'size-3.5' : 'size-3.5')} />
                </ActionBtn>
            )}

            {canFicha && onFicha && (
                <ActionBtn
                    onClick={onFicha}
                    title="Ficha de venta (objetivos, requisitos, público)"
                    label="Ficha"
                    colorClass="text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700"
                    variant={variant}
                >
                    <FileStack className="size-3.5 shrink-0" />
                </ActionBtn>
            )}

            {canModulos && onModulos && (
                <ActionBtn
                    onClick={onModulos}
                    title="Módulos del curso (unidades y estructura)"
                    label="Módulos"
                    colorClass="text-cyan-600 hover:bg-cyan-50 hover:text-cyan-800"
                    variant={variant}
                >
                    <Layers className="size-3.5 shrink-0" />
                </ActionBtn>
            )}

            {canMatriculas && onMatriculas && (
                <ActionBtn
                    onClick={onMatriculas}
                    title="Matrículas (alumnos inscritos en este curso)"
                    label="Matrículas"
                    colorClass="text-teal-600 hover:bg-teal-50 hover:text-teal-800"
                    variant={variant}
                >
                    <Users className="size-3.5 shrink-0" />
                </ActionBtn>
            )}

            {canPermissions && onPermissions && (
                <ActionBtn
                    onClick={onPermissions}
                    title="Gestionar permisos"
                    label="Permisos"
                    colorClass="text-violet-500 hover:bg-violet-50 hover:text-violet-700"
                    variant={variant}
                >
                    <KeyRound className="size-3.5 shrink-0" />
                </ActionBtn>
            )}

            {canEdit && onEdit && (
                <ActionBtn
                    onClick={onEdit}
                    title="Editar"
                    label="Editar"
                    colorClass="text-blue-500 hover:bg-blue-50 hover:text-blue-700"
                    variant={variant}
                >
                    <Pencil className="size-3.5 shrink-0" />
                </ActionBtn>
            )}

            {canDelete && onDelete && (
                <ActionBtn
                    onClick={onDelete}
                    title="Eliminar"
                    label="Eliminar"
                    colorClass="text-red-400 hover:bg-red-50 hover:text-red-600"
                    variant={variant}
                >
                    <Trash2 className="size-3.5 shrink-0" />
                </ActionBtn>
            )}
        </div>
    );
}

// ─── Botón base ───────────────────────────────────────────────────────────────

function ActionBtn({
    onClick,
    title,
    label,
    colorClass,
    variant = 'icon',
    children,
}: {
    onClick:   () => void;
    title:     string;
    label:     string;
    colorClass: string;
    variant?:  'icon' | 'labeled';
    children:  React.ReactNode;
}) {
    if (variant === 'labeled') {
        return (
            <button
                onClick={onClick}
                title={title}
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5',
                    'text-xs font-medium transition-all duration-150',
                    colorClass,
                )}
            >
                {children}
                <span>{label}</span>
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            title={title}
            className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150',
                colorClass,
            )}
        >
            {children}
        </button>
    );
}
