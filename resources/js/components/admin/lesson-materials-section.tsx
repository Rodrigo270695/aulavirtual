import type { ReactNode } from 'react';

type LessonMaterialsSectionProps = {
    icon: ReactNode;
    title: string;
    actions?: ReactNode;
    children: ReactNode;
};

export function LessonMaterialsSection({ icon, title, actions, children }: LessonMaterialsSectionProps) {
    return (
        <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                    {icon}
                    <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
                </div>
                {actions}
            </div>
            {children}
        </section>
    );
}

type LessonMaterialsRowProps = {
    indexLabel: string;
    title: string;
    subtitle?: string;
    actions?: ReactNode;
};

export function LessonMaterialsRow({ indexLabel, title, subtitle, actions }: LessonMaterialsRowProps) {
    return (
        <li className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2">
            <div className="flex w-8 flex-col items-center">
                <span className="text-[10px] font-bold text-slate-500">{indexLabel}</span>
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">{title}</p>
                {subtitle ? <p className="whitespace-pre-wrap text-xs text-slate-500">{subtitle}</p> : null}
            </div>
            {actions}
        </li>
    );
}

