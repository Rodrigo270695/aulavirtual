import { Link, usePage } from '@inertiajs/react';
import { BookOpen, ChevronDown } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import learning from '@/routes/learning';
import type { PlatformSettings } from '@/types/platform';
import type { LearningMenuRow } from '@/types/learning';

type LearningNavDropdownProps = {
    platform: PlatformSettings;
};

function progressLabel(row: LearningMenuRow): string {
    const pct = row.progress_pct;
    if (row.completed_at !== null || pct >= 99.5) {
        return 'Completado';
    }
    if (pct <= 0) {
        return 'Empieza a aprender';
    }
    return `${Math.round(pct)}% completado`;
}

export function LearningNavDropdown({ platform }: LearningNavDropdownProps) {
    const { learningMenu = [] } = usePage<{ learningMenu?: LearningMenuRow[] }>().props;
    const learningHref = learning.index.url();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                        'group/learn hidden h-auto items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition-all xl:inline-flex',
                        'hover:bg-[color-mix(in_srgb,var(--brand)_8%,white)] hover:text-slate-900 hover:shadow-sm',
                        'data-[state=open]:bg-[color-mix(in_srgb,var(--brand)_10%,white)] data-[state=open]:text-slate-900 data-[state=open]:shadow-sm',
                    )}
                    style={{ '--brand': platform.color_primary } as CSSProperties}
                >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100/90 text-slate-500 transition-colors group-hover/learn:bg-white group-hover/learn:text-[color:var(--brand)]">
                        <BookOpen className="size-4" strokeWidth={2} aria-hidden />
                    </span>
                    Mi aprendizaje
                    <ChevronDown className="size-4 opacity-60 transition-transform group-data-[state=open]/learn:rotate-180" aria-hidden />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                sideOffset={10}
                className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-0 shadow-xl"
            >
                <div className="max-h-[min(20rem,60vh)] overflow-y-auto">
                    {learningMenu.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-slate-600">
                            Aún no tienes cursos matriculados.{' '}
                            <Link href={home.url()} className="font-semibold text-violet-700 hover:underline">
                                Explora el catálogo
                            </Link>
                        </p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {learningMenu.map((row) => (
                                <li key={row.enrollment_id}>
                                    <Link
                                        href={learningHref}
                                        className="flex gap-3 px-3 py-3 transition-colors hover:bg-slate-50/95"
                                    >
                                        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                            {row.course.cover_image_url ? (
                                                <img
                                                    src={row.course.cover_image_url}
                                                    alt=""
                                                    className="size-full object-cover"
                                                />
                                            ) : (
                                                <div
                                                    className="flex size-full items-center justify-center text-[10px] font-semibold text-slate-400"
                                                    aria-hidden
                                                >
                                                    Curso
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-900">
                                                {row.course.title}
                                            </p>
                                            <p
                                                className={cn(
                                                    'mt-1.5 text-xs font-medium',
                                                    row.progress_pct <= 0 && row.completed_at === null
                                                        ? 'text-violet-600'
                                                        : 'text-slate-500',
                                                )}
                                            >
                                                {progressLabel(row)}
                                            </p>
                                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(100, Math.max(0, row.progress_pct))}%`,
                                                        background: `linear-gradient(90deg, ${platform.color_primary}, ${platform.color_accent})`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div
                    className="border-t border-slate-100 p-2"
                    style={{
                        background: `linear-gradient(180deg, rgba(248,250,252,0.9) 0%, #fff 100%)`,
                    }}
                >
                    <Link
                        href={learningHref}
                        className="flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold text-white shadow-md transition-[filter,transform] hover:brightness-[1.03] active:scale-[0.99]"
                        style={{
                            background: `linear-gradient(135deg, ${platform.color_primary}, ${platform.color_accent})`,
                        }}
                    >
                        Ir a Mi aprendizaje
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
