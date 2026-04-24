/**
 * Iconos Lucide permitidos para categorías (clave = nombre kebab en Lucide).
 * Mantener sincronizado con `App\Support\CategoryLucideIcons`.
 */

import type { LucideIcon } from 'lucide-react';
import {
    Award,
    BookOpen,
    Brain,
    Briefcase,
    Building2,
    Calculator,
    Camera,
    ClipboardList,
    Code,
    Cpu,
    Factory,
    FileText,
    FolderTree,
    Globe,
    GraduationCap,
    HardHat,
    HeartPulse,
    Home,
    LandPlot,
    Languages,
    LayoutGrid,
    Layers,
    Leaf,
    Library,
    Lightbulb,
    Microscope,
    Music,
    Package,
    Palette,
    Presentation,
    Scale,
    School,
    ShieldCheck,
    Stethoscope,
    Star,
    Tag,
    TreePine,
    TrendingUp,
    Trophy,
    UserRound,
    Users,
    Video,
    Wrench,
} from 'lucide-react';
import type { ReactNode } from 'react';

const LABELS: Record<string, string> = {
    'book-open': 'Libros / cursos',
    'graduation-cap': 'Educación',
    school: 'Escuela',
    library: 'Biblioteca',
    microscope: 'Ciencias',
    calculator: 'Matemáticas',
    'hard-hat': 'Ingeniería / obra',
    wrench: 'Técnica / mecánica',
    'heart-pulse': 'Salud',
    stethoscope: 'Medicina',
    scale: 'Derecho / justicia',
    'land-plot': 'Urbanismo / terreno',
    factory: 'Industrial',
    cpu: 'Tecnología',
    code: 'Programación',
    palette: 'Arte / diseño',
    music: 'Música',
    camera: 'Fotografía',
    video: 'Audiovisual',
    languages: 'Idiomas',
    globe: 'Internacional',
    users: 'Equipos / grupos',
    'user-round': 'Perfil / individual',
    briefcase: 'Negocios',
    award: 'Certificación',
    trophy: 'Logros',
    lightbulb: 'Innovación',
    brain: 'Psicología / conocimiento',
    leaf: 'Medio ambiente',
    'tree-pine': 'Naturaleza',
    'building-2': 'Arquitectura / edificios',
    home: 'Hogar',
    'shield-check': 'Seguridad / calidad',
    star: 'Destacados',
    'trending-up': 'Crecimiento / marketing',
    'layout-grid': 'Catálogo / rejilla',
    'folder-tree': 'Jerarquía',
    tag: 'Etiquetas',
    layers: 'Contenido / módulos',
    package: 'Paquetes',
    'file-text': 'Documentación',
    'clipboard-list': 'Evaluación / listas',
    presentation: 'Presentaciones',
};

const MAP: Record<string, LucideIcon> = {
    'book-open': BookOpen,
    'graduation-cap': GraduationCap,
    school: School,
    library: Library,
    microscope: Microscope,
    calculator: Calculator,
    'hard-hat': HardHat,
    wrench: Wrench,
    'heart-pulse': HeartPulse,
    stethoscope: Stethoscope,
    scale: Scale,
    'land-plot': LandPlot,
    factory: Factory,
    cpu: Cpu,
    code: Code,
    palette: Palette,
    music: Music,
    camera: Camera,
    video: Video,
    languages: Languages,
    globe: Globe,
    users: Users,
    'user-round': UserRound,
    briefcase: Briefcase,
    award: Award,
    trophy: Trophy,
    lightbulb: Lightbulb,
    brain: Brain,
    leaf: Leaf,
    'tree-pine': TreePine,
    'building-2': Building2,
    home: Home,
    'shield-check': ShieldCheck,
    star: Star,
    'trending-up': TrendingUp,
    'layout-grid': LayoutGrid,
    'folder-tree': FolderTree,
    tag: Tag,
    layers: Layers,
    package: Package,
    'file-text': FileText,
    'clipboard-list': ClipboardList,
    presentation: Presentation,
};

export type CategoryIconKey = keyof typeof MAP;

export const CATEGORY_ICON_KEYS = Object.keys(MAP) as CategoryIconKey[];

export function isCategoryIconKey(value: string): value is CategoryIconKey {
    return value in MAP;
}

/** Resuelve la clave guardada en BD a componente Lucide (o null). */
export function getCategoryLucideIcon(key: string | null | undefined): LucideIcon | null {
    if (!key || !(key in MAP)) {
        return null;
    }

    return MAP[key];
}

export interface CategoryIconComboOption {
    value: string;
    label: string;
    icon: ReactNode;
}

function iconNode(Icon: LucideIcon): ReactNode {
    return <Icon className="size-4 shrink-0 text-slate-600" aria-hidden />;
}

/** Opciones para combobox: ícono + etiqueta en español. Incluye «Sin ícono». */
export function getCategoryIconComboboxOptions(): CategoryIconComboOption[] {
    const sorted = [...CATEGORY_ICON_KEYS].sort((a, b) =>
        LABELS[a].localeCompare(LABELS[b], 'es', { sensitivity: 'base' }),
    );

    return [
        { value: '', label: 'Sin ícono', icon: <span className="size-4 shrink-0" aria-hidden /> },
        ...sorted.map((key) => ({
            value: key,
            label: LABELS[key],
            icon: iconNode(MAP[key]),
        })),
    ];
}
