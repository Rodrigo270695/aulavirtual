/**
 * admin/courses/ficha — Ficha de venta del curso (objetivos, requisitos, público).
 */

import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BookOpen, ClipboardList, ListChecks, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { CourseFichaTabs } from '@/components/admin/course-ficha-tabs';
import type { CourseFichaTabId } from '@/components/admin/course-ficha-tabs';
import { PageHeader } from '@/components/admin/page-header';
import { ObjectivesTab } from '@/pages/admin/courses/ficha/tabs/objectives-tab';
import { RequirementsTab } from '@/pages/admin/courses/ficha/tabs/requirements-tab';
import { TargetAudienceTab } from '@/pages/admin/courses/ficha/tabs/target-audience-tab';
import { dashboard } from '@/routes';
import coursesRoute from '@/routes/admin/courses';
import type { CourseFichaCan, CourseFichaCourse } from '@/types';

interface Props {
    course: CourseFichaCourse;
    can: CourseFichaCan;
}

export default function CourseFichaPage({ course, can }: Props) {
    const [tab, setTab] = useState<CourseFichaTabId>('objectives');

    const objectivesUrl = coursesRoute.ficha.objectives.update.url({ course: course.id });
    const requirementsUrl = coursesRoute.ficha.requirements.update.url({ course: course.id });
    const audiencesUrl = coursesRoute.ficha.targetAudiences.update.url({ course: course.id });

    const catLabel = course.category ? `${course.category.name} · /${course.category.slug}` : '—';

    return (
        <>
            <Head title={`Ficha · ${course.title}`} />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title={course.title}
                    description={`Ficha de venta: texto que verá el estudiante en la página del curso. Categoría: ${catLabel}. Slug: /${course.slug}`}
                    icon={<BookOpen />}
                    stats={[
                        {
                            label: 'Objetivos',
                            value: course.objectives.length,
                            icon: <ListChecks className="size-3.5" />,
                            color: 'blue',
                        },
                        {
                            label: 'Requisitos',
                            value: course.requirements.length,
                            icon: <ClipboardList className="size-3.5" />,
                            color: 'purple',
                        },
                        {
                            label: 'Público',
                            value: course.target_audiences.length,
                            icon: <UsersRound className="size-3.5" />,
                            color: 'green',
                        },
                    ]}
                    actions={
                        <Link
                            href={coursesRoute.index.url()}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300/90 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50"
                        >
                            <ArrowLeft className="size-4" />
                            Volver a cursos
                        </Link>
                    }
                />

                <CourseFichaTabs active={tab} onChange={setTab} className="max-w-3xl" />

                <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
                    {tab === 'objectives' && (
                        <ObjectivesTab course={course} updateUrl={objectivesUrl} canEdit={can.edit} />
                    )}
                    {tab === 'requirements' && (
                        <RequirementsTab course={course} updateUrl={requirementsUrl} canEdit={can.edit} />
                    )}
                    {tab === 'audience' && (
                        <TargetAudienceTab course={course} updateUrl={audiencesUrl} canEdit={can.edit} />
                    )}
                </div>
            </div>
        </>
    );
}

CourseFichaPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Cursos', href: coursesRoute.index.url() },
    ],
};
