/**
 * sidebar-nav.ts
 *
 * Fuente única de verdad para la navegación del sidebar.
 * Para agregar un módulo nuevo: añade un NavGroup en la sección correspondiente.
 * Para agregar un ítem: añade un NavSubItem dentro del grupo.
 * Los campos `permission` y `disabled` son opcionales.
 *
 * Convención de permisos: recurso.acción  (ej: cursos.view, usuarios.edit)
 * Convención de hrefs:    '#' = ruta pendiente de implementar
 */

import {
    Award,
    BarChart3,
    BookMarked,
    BookOpen,
    BookText,
    Boxes,
    CircleDollarSign,
    ClipboardList,
    CreditCard,
    FileText,
    FolderOpen,
    GraduationCap,
    LayoutGrid,
    ListChecks,
    MessageSquare,
    Package,
    ScrollText,
    RefreshCcw,
    Settings2,
    ShieldCheck,
    ShoppingCart,
    Star,
    Ticket,
    TrendingUp,
    UserCheck,
    UserCog,
    Users,
    Video,
    Wallet,
} from 'lucide-react';
import { dashboard } from '@/routes';
import type { NavItem, NavSection } from '@/types';

// ─── Ítems simples (nivel raíz, sin grupo colapsable) ────────────────────────

export const topNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        permission: 'dashboard.view',
    },
];

// ─── Secciones del sidebar ────────────────────────────────────────────────────

export const sidebarSections: NavSection[] = [

    // ── 1. USUARIOS ──────────────────────────────────────────────────────────
    {
        label: 'Usuarios',
        groups: [
            {
                title: 'Gestión de Usuarios',
                icon: Users,
                items: [
                    { title: 'Todos los usuarios', href: '/admin/users', icon: Users, permission: 'usuarios.view' },
                    { title: 'Instructores', href: '/admin/instructors', icon: UserCheck, permission: 'instructores.view' },
                    { title: 'Credenciales docentes', href: '/admin/instructor-credentials', icon: Award, permission: 'credenciales_docentes.view' },
                ],
            },
            {
                title: 'Roles y Permisos',
                icon: ShieldCheck,
                permission: 'roles.view',
                items: [
                    { title: 'Roles', href: '/admin/roles', icon: UserCog },
                ],
            },
        ],
    },

    // ── 2. CATÁLOGO ───────────────────────────────────────────────────────────
    {
        label: 'Catálogo',
        groups: [
            {
                title: 'Clasificación',
                icon: FolderOpen,
                permission: 'categorias.view',
                items: [
                    { title: 'Categorías y etiquetas', href: '/admin/categories', icon: FolderOpen, permission: 'categorias.view' },
                ],
            },
            {
                title: 'Cursos',
                icon: BookOpen,
                items: [
                    { title: 'Todos los cursos', href: '/admin/courses', icon: BookOpen, permission: 'cursos.view' },
                    {
                        title: 'Especializaciones',
                        href: '/admin/specializations',
                        icon: BookMarked,
                        permission: 'especializaciones.view',
                    },
                    {
                        title: 'Paquetes',
                        href: '/admin/packages',
                        icon: Package,
                        permission: 'paquetes.view',
                    },
                ],
            },
        ],
    },

    // ── 3. CONTENIDO ─────────────────────────────────────────────────────────
    {
        label: 'Contenido',
        groups: [
            {
                title: 'Estructura del Curso',
                icon: BookText,
                permission: 'contenido.view',
                items: [
                    { title: 'Módulos',    href: '#', icon: Boxes,     disabled: true },
                    { title: 'Lecciones',  href: '#', icon: BookText,  disabled: true },
                ],
            },
            {
                title: 'Recursos Multimedia',
                icon: Video,
                permission: 'contenido.view',
                items: [
                    { title: 'Videos',     href: '#', icon: Video,     disabled: true },
                    { title: 'Documentos', href: '#', icon: FileText,  disabled: true },
                    { title: 'Recursos',   href: '#', icon: FolderOpen, disabled: true },
                ],
            },
        ],
    },

    // ── 4. EVALUACIONES ───────────────────────────────────────────────────────
    {
        label: 'Evaluaciones',
        groups: [
            {
                title: 'Cuestionarios',
                icon: ClipboardList,
                permission: 'evaluaciones.view',
                items: [
                    { title: 'Cuestionarios',       href: '#', icon: ClipboardList, disabled: true },
                    { title: 'Banco de preguntas',  href: '#', icon: ListChecks,    disabled: true },
                    { title: 'Intentos de alumnos', href: '#', icon: UserCog,       disabled: true },
                ],
            },
        ],
    },

    // ── 5. MATRÍCULAS ─────────────────────────────────────────────────────────
    {
        label: 'Matrículas',
        groups: [
            {
                title: 'Control de Acceso',
                icon: GraduationCap,
                permission: 'matriculas.view',
                items: [
                    { title: 'Matrículas activas',        href: '#', icon: GraduationCap, disabled: true },
                    { title: 'Progreso de estudiantes',   href: '#', icon: TrendingUp,    disabled: true },
                ],
            },
        ],
    },

    // ── 6. RESEÑAS ────────────────────────────────────────────────────────────
    {
        label: 'Comunidad',
        groups: [
            {
                title: 'Reseñas y Valoraciones',
                icon: Star,
                permission: 'resenas.view',
                items: [
                    { title: 'Reseñas de cursos', href: '#', icon: Star,          disabled: true },
                    { title: 'Moderación',         href: '#', icon: MessageSquare, disabled: true },
                ],
            },
        ],
    },

    // ── 7. CERTIFICADOS ───────────────────────────────────────────────────────
    {
        label: 'Certificados',
        groups: [
            {
                title: 'Acreditación',
                icon: Award,
                items: [
                    {
                        title: 'Emitidos',
                        href: '/admin/certificates',
                        icon: Award,
                        permission: 'certificados_emitidos.view',
                    },
                    {
                        title: 'Plantillas',
                        href: '/admin/certificate-templates',
                        icon: FileText,
                        permission: 'certificados_plantillas.view',
                    },
                ],
            },
        ],
    },

    // ── 8. COMERCIO ───────────────────────────────────────────────────────────
    {
        label: 'Comercio',
        groups: [
            {
                title: 'Ventas',
                icon: ShoppingCart,
                permission: 'comercio.view',
                items: [
                    {
                        title: 'Órdenes',
                        href: '/admin/orders',
                        icon: ShoppingCart,
                        permission: 'ordenes.view',
                    },
                    { title: 'Pagos',       href: '/admin/payments', icon: CreditCard, permission: 'pagos.view' },
                    { title: 'Reembolsos',  href: '/admin/refunds', icon: RefreshCcw, permission: 'reembolsos.view' },
                ],
            },
            {
                title: 'Descuentos',
                icon: Ticket,
                permission: 'cupones.view',
                items: [
                    { title: 'Cupones',     href: '/admin/coupons', icon: Ticket, permission: 'cupones.view' },
                ],
            },
            {
                title: 'Liquidaciones',
                icon: Wallet,
                permission: 'liquidaciones_instructores.view',
                items: [
                    { title: 'Pagos a instructores', href: '/admin/instructor-payouts', icon: CircleDollarSign, permission: 'liquidaciones_instructores.view' },
                ],
            },
        ],
    },

    // ── 9. REPORTES ───────────────────────────────────────────────────────────
    {
        label: 'Reportes',
        groups: [
            {
                title: 'Analíticas',
                icon: BarChart3,
                permission: 'reportes.view',
                items: [
                    { title: 'Ventas',          href: '#', icon: TrendingUp,  disabled: true },
                    { title: 'Estudiantes',     href: '#', icon: Users,       disabled: true },
                    { title: 'Cursos populares',href: '#', icon: BookOpen,    disabled: true },
                ],
            },
        ],
    },

    // ── 10. CONFIGURACIÓN ─────────────────────────────────────────────────────
    {
        label: 'Configuración',
        groups: [
            {
                title: 'Sistema',
                icon: Settings2,
                items: [
                    { title: 'Plataforma', href: '/admin/platform-settings', icon: Settings2, permission: 'plataforma.view' },
                    { title: 'General', href: '/admin/general-settings', icon: Settings2, permission: 'general.view' },
                    { title: 'Notificaciones',      href: '/admin/notifications', icon: MessageSquare, permission: 'notificaciones.view' },
                    { title: 'Auditoría',           href: '/admin/audit', icon: ScrollText, permission: 'auditoria.view' },
                ],
            },
        ],
    },
];
