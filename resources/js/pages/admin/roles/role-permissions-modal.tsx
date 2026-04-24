/**
 * RolePermissionsModal — gestiona los permisos de un rol existente.
 *
 * Diseño de carpetas colapsables por módulo, chips compactos.
 * La acción "view" controla la visibilidad en el sidebar.
 */

import { useForm } from '@inertiajs/react';
import {
    BadgeCheck,
    ChevronRight,
    Eye,
    FilePen,
    FolderClosed,
    FolderOpen,
    ListChecks,
    ListOrdered,
    Plus,
    Settings2,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import * as rolesRoute from '@/routes/admin/roles';
import type { Permission, Role } from '@/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    open: boolean;
    onClose: () => void;
    role: Role | null;
    permissions: Permission[];
}

interface FormData {
    name: string;
    permissions: string[];
}

// ─── Mapas de presentación ────────────────────────────────────────────────────

const MODULE_LABELS: Record<string, string> = {
    dashboard:    'Dashboard',
    roles:        'Roles',
    usuarios:     'Usuarios',
    instructores: 'Instructores',
    credenciales_docentes: 'Credenciales docentes',
    cursos:            'Cursos',
    cursos_modulos:    'Curso · Módulos',
    cursos_lecciones:            'Curso · Lecciones',
    cursos_lecciones_documentos: 'Curso · Lección · Documentos',
    cursos_lecciones_recursos:   'Curso · Lección · Recursos',
    cursos_lecciones_videos:     'Curso · Lección · Vídeo',
    cursos_lecciones_tareas:     'Curso · Lección · Tarea',
    cursos_lecciones_quizzes:    'Curso · Lección · Cuestionario',
    learning_tareas_entregas:    'Aula · Entregas de tarea',
    learning_curso_resenas:      'Aula · Reseñas del curso',
    cursos_ficha:                'Curso · Ficha de venta',
    cursos_matriculas:           'Curso · Matrículas',
    especializaciones: 'Especializaciones',
    paquetes:       'Paquetes',
    certificados_emitidos: 'Certificados · Emitidos',
    certificados_plantillas: 'Certificados · Plantillas',
    categorias:   'Categorías',
    contenido:    'Contenido',
    evaluaciones: 'Evaluaciones',
    matriculas:   'Matrículas',
    resenas:      'Reseñas',
    certificados: 'Certificados',
    comercio:     'Comercio',
    cupones:      'Cupones',
    ordenes:      'Órdenes',
    pagos:        'Pagos',
    reembolsos:   'Reembolsos',
    liquidaciones_instructores: 'Liquidaciones · Instructores',
    notificaciones: 'Notificaciones',
    auditoria:    'Auditoría',
    reportes:     'Reportes',
    config:       'Configuración',
    plataforma:   'Plataforma',
    general:      'General',
};

/** Orden fijo de carpetas en el modal (el resto va alfabético al final). */
const MODULE_ORDER: string[] = [
    'dashboard',
    'usuarios',
    'instructores',
    'credenciales_docentes',
    'roles',
    'categorias',
    'cursos',
    'cursos_modulos',
    'cursos_lecciones',
    'cursos_lecciones_documentos',
    'cursos_lecciones_recursos',
    'cursos_lecciones_videos',
    'cursos_lecciones_tareas',
    'cursos_lecciones_quizzes',
    'learning_tareas_entregas',
    'learning_curso_resenas',
    'cursos_ficha',
    'cursos_matriculas',
    'especializaciones',
    'paquetes',
    'certificados_emitidos',
    'certificados_plantillas',
    'contenido',
    'evaluaciones',
    'matriculas',
    'resenas',
    'certificados',
    'comercio',
    'cupones',
    'ordenes',
    'pagos',
    'reembolsos',
    'liquidaciones_instructores',
    'notificaciones',
    'auditoria',
    'reportes',
    'config',
    'plataforma',
    'general',
];

function compareModuleKeys(a: string, b: string): number {
    const ia = MODULE_ORDER.indexOf(a);
    const ib = MODULE_ORDER.indexOf(b);

    if (ia === -1 && ib === -1) {
        return a.localeCompare(b);
    }

    if (ia === -1) {
        return 1;
    }

    if (ib === -1) {
        return -1;
    }

    return ia - ib;
}

const ACTION_META: Record<string, { label: string; icon: React.ElementType; active: string; dot: string }> = {
    view:        { label: 'Ver',         icon: Eye,       active: 'bg-indigo-100 text-indigo-700 border-indigo-200',  dot: 'bg-indigo-400' },
    items:       { label: 'Ítems',       icon: ListOrdered, active: 'bg-sky-100 text-sky-800 border-sky-200',       dot: 'bg-sky-500' },
    create:      { label: 'Crear',       icon: Plus,      active: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
    verifications: { label: 'Consultas', icon: ListChecks, active: 'bg-sky-100 text-sky-800 border-sky-200', dot: 'bg-sky-500' },
    edit:        { label: 'Editar',      icon: FilePen,   active: 'bg-amber-100 text-amber-700 border-amber-200',    dot: 'bg-amber-400' },
    delete:      { label: 'Eliminar',    icon: Trash2,    active: 'bg-rose-100 text-rose-700 border-rose-200',       dot: 'bg-rose-400' },
    verify:      { label: 'Verificar',   icon: BadgeCheck, active: 'bg-teal-100 text-teal-800 border-teal-200',      dot: 'bg-teal-500' },
    permissions: { label: 'Permisos',   icon: ShieldCheck, active: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-400' },
};

const DEFAULT_META = { label: '', icon: Settings2, active: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };

function getMeta(action: string) {
    return ACTION_META[action] ?? { ...DEFAULT_META, label: action };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Grouped = Record<string, Permission[]>;

function groupPermissions(permissions: Permission[]): Grouped {
    return permissions.reduce<Grouped>((acc, p) => {
        const mod = p.name.split('.')[0];

        if (!acc[mod]) {
            acc[mod] = [];
        }

        acc[mod].push(p);

        return acc;
    }, {});
}

const ACTION_ORDER = ['view', 'items', 'create', 'verifications', 'edit', 'delete', 'verify', 'permissions'];

function sortPerms(perms: Permission[]): Permission[] {
    return [...perms].sort((a, b) => {
        const aA = a.name.split('.')[1] ?? '';
        const bA = b.name.split('.')[1] ?? '';
        const ai = ACTION_ORDER.indexOf(aA);
        const bi = ACTION_ORDER.indexOf(bA);

        if (ai === -1 && bi === -1) {
            return aA.localeCompare(bA);
        }

        if (ai === -1) {
            return 1;
        }

        if (bi === -1) {
            return -1;
        }

        return ai - bi;
    });
}

// ─── PermChip (chip individual de permiso) ────────────────────────────────────

function PermChip({
    perm,
    checked,
    isView,
    onChange,
}: {
    perm: Permission;
    checked: boolean;
    isView: boolean;
    onChange: () => void;
}) {
    const action = perm.name.split('.')[1] ?? perm.name;
    const meta   = getMeta(action);
    const Icon   = meta.icon;

    return (
        <button
            type="button"
            onClick={onChange}
            title={isView ? 'Controla la visibilidad en el menú lateral' : meta.label}
            className={cn(
                'inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5',
                'text-[11px] font-medium transition-all duration-150',
                'focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-400',
                checked
                    ? meta.active
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
            )}
        >
            {/* Dot indicador */}
            <span className={cn('size-1.5 rounded-full transition-colors', checked ? meta.dot : 'bg-slate-300')} />
            <Icon className="size-2.5 shrink-0" />
            <span>{meta.label || action}</span>
            {isView && (
                <span className={cn(
                    'rounded-full px-1 text-[8px] font-bold uppercase tracking-wide',
                    checked ? 'opacity-70' : 'opacity-40',
                )}>
                    acceso
                </span>
            )}
        </button>
    );
}

// ─── ModuleRow (fila de módulo colapsable) ────────────────────────────────────

function ModuleRow({
    module,
    perms,
    selected,
    defaultOpen,
    onToggle,
    onToggleAll,
}: {
    module:      string;
    perms:       Permission[];
    selected:    string[];
    defaultOpen: boolean;
    onToggle:    (name: string) => void;
    onToggleAll: (perms: Permission[]) => void;
}) {
    const sorted      = sortPerms(perms);
    const checkedCnt  = perms.filter((p) => selected.includes(p.name)).length;
    const allChecked  = checkedCnt === perms.length;
    const someChecked = checkedCnt > 0 && !allChecked;
    const [open, setOpen] = useState(defaultOpen);

    // Auto-expandir solo cuando cambia la selección del módulo (no al colapsar manualmente).
    useEffect(() => {
        if (checkedCnt > 0 && !open) {
            setOpen(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- `open` fuera de deps a propósito (evita reabrir al colapsar)
    }, [checkedCnt]);

    const label      = MODULE_LABELS[module] ?? module.charAt(0).toUpperCase() + module.slice(1);
    const FolderIcon = open ? FolderOpen : FolderClosed;
    const hasView    = perms.some((p) => p.name === `${module}.view`);
    const viewOn     = selected.includes(`${module}.view`);
    const warnAccess = hasView && !viewOn && checkedCnt > 0;

    return (
        <div className={cn(
            'rounded-lg border transition-colors',
            checkedCnt > 0 ? 'border-blue-100 bg-blue-50/30' : 'border-slate-100 bg-white',
        )}>
            {/* ── Cabecera ── */}
            <div className="flex items-center gap-2 px-3 py-2">

                {/* Select-all */}
                <button
                    type="button"
                    onClick={() => onToggleAll(perms)}
                    title={allChecked ? 'Desmarcar todos' : 'Marcar todos'}
                    className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded text-[9px] font-bold',
                        'transition-all border focus:outline-none',
                        allChecked
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : someChecked
                              ? 'border-blue-400 bg-blue-100 text-blue-600'
                              : 'border-slate-300 text-slate-400 hover:border-slate-400',
                    )}
                >
                    {allChecked ? '✓' : someChecked ? '−' : ''}
                </button>

                {/* Ícono carpeta + nombre (clic para expandir) */}
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="flex flex-1 min-w-0 items-center gap-1.5 focus:outline-none"
                >
                    <FolderIcon className={cn('size-3.5 shrink-0', checkedCnt > 0 ? 'text-blue-500' : 'text-slate-400')} />
                    <span className={cn(
                        'truncate text-[12px] font-semibold',
                        checkedCnt > 0 ? 'text-blue-800' : 'text-slate-600',
                    )}>
                        {label}
                    </span>
                    {warnAccess && (
                        <span className="ml-1 flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-px text-[9px] font-semibold text-amber-600">
                            <Eye className="size-2" />sin menú
                        </span>
                    )}
                </button>

                {/* Contador */}
                <span className={cn(
                    'shrink-0 text-[10px] font-semibold tabular-nums',
                    checkedCnt > 0 ? 'text-blue-600' : 'text-slate-400',
                )}>
                    {checkedCnt}/{perms.length}
                </span>

                {/* Chevron */}
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                    <ChevronRight className={cn('size-3.5 transition-transform duration-200', open && 'rotate-90')} />
                </button>
            </div>

            {/* ── Chips de permisos ── */}
            {open && (
                <div className="flex flex-wrap gap-1.5 border-t border-slate-100/80 px-3 pb-2.5 pt-2">
                    {sorted.map((perm) => {
                        const action = perm.name.split('.')[1] ?? '';

                        return (
                            <PermChip
                                key={perm.id}
                                perm={perm}
                                checked={selected.includes(perm.name)}
                                isView={action === 'view'}
                                onChange={() => onToggle(perm.name)}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── RolePermissionsModal ─────────────────────────────────────────────────────

export function RolePermissionsModal({ open, onClose, role, permissions }: Props) {
    const { data, setData, put, processing, reset, clearErrors } = useForm<FormData>({
        name: '',
        permissions: [],
    });

    useEffect(() => {
        if (open && role) {
            setData({
                name: role.name,
                permissions: role.permissions?.map((p) => p.name) ?? [],
            });
            clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sincronizar formulario al abrir / cambiar rol
    }, [open, role]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!role) {
            return;
        }

        put(rolesRoute.update.url(role.id), { onSuccess: handleClose, preserveScroll: true });
    };

    const togglePermission = (name: string) => {
        setData(
            'permissions',
            data.permissions.includes(name)
                ? data.permissions.filter((p) => p !== name)
                : [...data.permissions, name],
        );
    };

    const toggleGroup = (perms: Permission[]) => {
        const allChecked = perms.every((p) => data.permissions.includes(p.name));

        if (allChecked) {
            setData('permissions', data.permissions.filter((n) => !perms.some((p) => p.name === n)));
        } else {
            const toAdd = perms.map((p) => p.name).filter((n) => !data.permissions.includes(n));
            setData('permissions', [...data.permissions, ...toAdd]);
        }
    };

    const grouped  = groupPermissions(permissions);
    const selected = data.permissions.length;

    const footer = (
        <div className="flex w-full items-center justify-between gap-3">
            <span className={cn(
                'flex items-center gap-1.5 text-[11px] font-medium',
                selected > 0 ? 'text-blue-600' : 'text-slate-400',
            )}>
                <ShieldCheck className="size-3" />
                {selected} / {permissions.length} permisos
            </span>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                    Cancelar
                </button>
                <button
                    form="permissions-form"
                    type="submit"
                    disabled={processing}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
                >
                    {processing ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </div>
    );

    if (!role) {
        return null;
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={
                <span className="flex items-center gap-2 text-[15px]">
                    <span
                        className="flex size-6 items-center justify-center rounded-md"
                        style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
                    >
                        <ShieldCheck className="size-3.5 text-white" />
                    </span>
                    Permisos: <span className="text-blue-600">{role.name}</span>
                </span>
            }
            description={
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Eye className="size-3 text-indigo-400" />
                    El chip <strong className="text-indigo-600">acceso</strong> controla qué módulos aparecen en el menú lateral.
                </span>
            }
            size="lg"
            footer={footer}
        >
            <form id="permissions-form" onSubmit={handleSubmit}>
                {permissions.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">No hay permisos registrados.</p>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        {Object.entries(grouped)
                            .sort(([ma], [mb]) => compareModuleKeys(ma, mb))
                            .map(([module, perms], idx) => (
                                <ModuleRow
                                    key={module}
                                    module={module}
                                    perms={perms}
                                    selected={data.permissions}
                                    defaultOpen={
                                        idx === 0 || perms.some((p) => data.permissions.includes(p.name))
                                    }
                                    onToggle={togglePermission}
                                    onToggleAll={toggleGroup}
                                />
                            ))}
                    </div>
                )}
            </form>
        </Modal>
    );
}
