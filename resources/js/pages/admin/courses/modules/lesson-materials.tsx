/**
 * Vídeo principal, documentos y recursos externos de una lección.
 */

import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    BookMarked,
    ClipboardList,
    ExternalLink,
    FileText,
    Layers,
    Pencil,
    Plus,
    Trash2,
    Video,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { LessonMaterialsRow, LessonMaterialsSection } from '@/components/admin/lesson-materials-section';
import { PageHeader } from '@/components/admin/page-header';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { LessonDocumentFormModal } from '@/pages/admin/courses/lesson-document-form-modal';
import { LessonResourceFormModal } from '@/pages/admin/courses/lesson-resource-form-modal';
import { LessonVideoFormModal } from '@/pages/admin/courses/lesson-video-form-modal';
import { dashboard } from '@/routes';
import coursesRoute from '@/routes/admin/courses';
import type {
    AdminLessonDocument,
    AdminLessonMaterialSummary,
    AdminLessonResource,
    AdminLessonVideo,
    CourseCategoryRef,
    LessonMaterialsDocCan,
    LessonMaterialsHomeworkCan,
    LessonMaterialsResCan,
    LessonMaterialsVideoCan,
} from '@/types';
import { cn } from '@/lib/utils';

interface CourseHeader {
    id: string;
    title: string;
    slug: string;
    category: CourseCategoryRef | null;
}

interface ModuleHeader {
    id: string;
    title: string;
}

interface Props {
    course: CourseHeader;
    module: ModuleHeader;
    lesson: AdminLessonMaterialSummary;
    video: AdminLessonVideo | null;
    documents: AdminLessonDocument[];
    resources: AdminLessonResource[];
    videoCan: LessonMaterialsVideoCan;
    documentsCan: LessonMaterialsDocCan;
    resourcesCan: LessonMaterialsResCan;
    homeworkCan: LessonMaterialsHomeworkCan;
}

const LESSON_TYPE_LABEL: Record<string, string> = {
    article: 'Artículo',
    video: 'Vídeo',
    document: 'Documento',
    quiz: 'Cuestionario',
    assignment: 'Tarea',
};

const VIDEO_SOURCE_LABEL: Record<string, string> = {
    upload: 'Archivo subido',
    youtube: 'YouTube',
    vimeo: 'Vimeo',
    external: 'URL externa',
};

function formatBytes(n: number | null): string {
    if (n == null || n <= 0) {
        return '—';
    }
    const units = ['B', 'KB', 'MB', 'GB'];
    let v = n;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i++;
    }
    return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

function formatDurationSec(sec: number): string {
    if (sec <= 0) {
        return '—';
    }
    if (sec < 60) {
        return `${sec}s`;
    }
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function LessonMaterialsPage({
    course,
    module,
    lesson,
    video,
    documents,
    resources,
    videoCan,
    documentsCan,
    resourcesCan,
    homeworkCan,
}: Props) {
    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [videoDeleteOpen, setVideoDeleteOpen] = useState(false);
    const [videoDeleting, setVideoDeleting] = useState(false);

    const [docModalOpen, setDocModalOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<AdminLessonDocument | null>(null);
    const [resModalOpen, setResModalOpen] = useState(false);
    const [editingRes, setEditingRes] = useState<AdminLessonResource | null>(null);

    const [docDeleteOpen, setDocDeleteOpen] = useState(false);
    const [docDeleting, setDocDeleting] = useState(false);
    const [docPending, setDocPending] = useState<AdminLessonDocument | null>(null);

    const [resDeleteOpen, setResDeleteOpen] = useState(false);
    const [resDeleting, setResDeleting] = useState(false);
    const [resPending, setResPending] = useState<AdminLessonResource | null>(null);
    const [homeworkEditing, setHomeworkEditing] = useState(false);
    const [homeworkSaving, setHomeworkSaving] = useState(false);
    const [homeworkTitle, setHomeworkTitle] = useState(lesson.homework_title ?? lesson.title);
    const [homeworkInstructions, setHomeworkInstructions] = useState(lesson.homework_instructions ?? '');

    const sortedDocs = useMemo(
        () => [...documents].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)),
        [documents],
    );
    const sortedRes = useMemo(
        () => [...resources].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)),
        [resources],
    );

    const modulesUrl = coursesRoute.modules.index.url({ course: course.id });
    const homeworkUpdateUrl = coursesRoute.modules.lessons.homework.update.url({
        course: course.id,
        course_module: module.id,
        lesson: lesson.id,
    });
    const homeworkDestroyUrl = coursesRoute.modules.lessons.homework.destroy.url({
        course: course.id,
        course_module: module.id,
        lesson: lesson.id,
    });

    const moveDoc = useCallback(
        (index: number, dir: -1 | 1) => {
            const next = index + dir;
            if (next < 0 || next >= sortedDocs.length) {
                return;
            }
            const copy = [...sortedDocs];
            const a = copy[index]!;
            const b = copy[next]!;
            copy[index] = b;
            copy[next] = a;
            router.put(
                coursesRoute.modules.lessons.documents.reorder.url({
                    course: course.id,
                    course_module: module.id,
                    lesson: lesson.id,
                }),
                { order: copy.map((d) => d.id) },
                { preserveScroll: true },
            );
        },
        [course.id, lesson.id, module.id, sortedDocs],
    );

    const moveRes = useCallback(
        (index: number, dir: -1 | 1) => {
            const next = index + dir;
            if (next < 0 || next >= sortedRes.length) {
                return;
            }
            const copy = [...sortedRes];
            const a = copy[index]!;
            const b = copy[next]!;
            copy[index] = b;
            copy[next] = a;
            router.put(
                coursesRoute.modules.lessons.resources.reorder.url({
                    course: course.id,
                    course_module: module.id,
                    lesson: lesson.id,
                }),
                { order: copy.map((r) => r.id) },
                { preserveScroll: true },
            );
        },
        [course.id, lesson.id, module.id, sortedRes],
    );

    const confirmDeleteDoc = useCallback(() => {
        if (!docPending) {
            return;
        }
        setDocDeleting(true);
        router.delete(
            coursesRoute.modules.lessons.documents.destroy.url({
                course: course.id,
                course_module: module.id,
                lesson: lesson.id,
                lesson_document: docPending.id,
            }),
            {
                preserveScroll: true,
                onFinish: () => {
                    setDocDeleting(false);
                    setDocDeleteOpen(false);
                    setDocPending(null);
                },
            },
        );
    }, [course.id, docPending, lesson.id, module.id]);

    const confirmDeleteRes = useCallback(() => {
        if (!resPending) {
            return;
        }
        setResDeleting(true);
        router.delete(
            coursesRoute.modules.lessons.resources.destroy.url({
                course: course.id,
                course_module: module.id,
                lesson: lesson.id,
                lesson_resource: resPending.id,
            }),
            {
                preserveScroll: true,
                onFinish: () => {
                    setResDeleting(false);
                    setResDeleteOpen(false);
                    setResPending(null);
                },
            },
        );
    }, [course.id, lesson.id, module.id, resPending]);

    const catLabel = course.category ? `${course.category.name}` : '—';

    const confirmDeleteVideo = useCallback(() => {
        setVideoDeleting(true);
        router.delete(
            coursesRoute.modules.lessons.video.destroy.url({
                course: course.id,
                course_module: module.id,
                lesson: lesson.id,
            }),
            {
                preserveScroll: true,
                onFinish: () => {
                    setVideoDeleting(false);
                    setVideoDeleteOpen(false);
                },
            },
        );
    }, [course.id, lesson.id, module.id]);

    const saveHomework = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            setHomeworkSaving(true);
            router.put(
                homeworkUpdateUrl,
                {
                    homework_title: homeworkTitle,
                    homework_instructions: homeworkInstructions,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => setHomeworkEditing(false),
                    onFinish: () => setHomeworkSaving(false),
                },
            );
        },
        [homeworkInstructions, homeworkTitle, homeworkUpdateUrl],
    );

    const removeHomework = useCallback(() => {
        setHomeworkSaving(true);
        router.delete(homeworkDestroyUrl, {
            preserveScroll: true,
            onSuccess: () => {
                setHomeworkEditing(false);
                setHomeworkTitle(lesson.title);
                setHomeworkInstructions('');
            },
            onFinish: () => setHomeworkSaving(false),
        });
    }, [homeworkDestroyUrl, lesson.title]);

    return (
        <>
            <Head title={`Materiales · ${lesson.title}`} />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title={lesson.title}
                    description={`Módulo «${module.title}». Curso: ${course.title}. Categoría: ${catLabel}. Tipo de lección: ${LESSON_TYPE_LABEL[lesson.lesson_type] ?? lesson.lesson_type}.`}
                    icon={<BookMarked />}
                    actions={
                        <Link
                            href={modulesUrl}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300/90 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50"
                        >
                            <ArrowLeft className="size-4" />
                            Volver a módulos
                        </Link>
                    }
                />

                {homeworkCan.view ? (
                    <LessonMaterialsSection
                        icon={<ClipboardList className="size-5 text-amber-600" />}
                        title="Tarea de la lección"
                        actions={
                            <div className="flex items-center gap-2">
                                {!lesson.has_homework && homeworkCan.create && (
                                    <button
                                        type="button"
                                        onClick={() => setHomeworkEditing((v) => !v)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                                    >
                                        <Pencil className="size-3.5" />
                                        {homeworkEditing ? 'Cerrar' : 'Añadir tarea'}
                                    </button>
                                )}
                            </div>
                        }
                    >
                        {!lesson.has_homework ? (
                            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
                                Esta lección no tiene tarea configurada. Puedes añadirla aunque la lección sea de tipo{' '}
                                <strong className="font-semibold">{LESSON_TYPE_LABEL[lesson.lesson_type] ?? lesson.lesson_type}</strong>.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                <LessonMaterialsRow
                                    indexLabel="1"
                                    title={lesson.homework_title?.trim() || lesson.title}
                                    subtitle={lesson.homework_instructions?.trim() || 'Sin instrucciones adicionales.'}
                                    actions={
                                        <>
                                            {homeworkCan.edit && (
                                                <button
                                                    type="button"
                                                    title="Editar"
                                                    onClick={() => setHomeworkEditing(true)}
                                                    className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-50"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                            )}
                                            {homeworkCan.delete && (
                                                <button
                                                    type="button"
                                                    title="Eliminar"
                                                    onClick={removeHomework}
                                                    disabled={homeworkSaving}
                                                    className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            )}
                                        </>
                                    }
                                />
                            </ul>
                        )}

                        {homeworkEditing ? (
                            <form onSubmit={saveHomework} className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700">Premisa / título de la tarea</label>
                                    <input
                                        type="text"
                                        value={homeworkTitle}
                                        onChange={(e) => setHomeworkTitle(e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-amber-300 focus:ring"
                                        placeholder="Ej: Explica qué es la IA con tus palabras"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700">Instrucciones para el estudiante</label>
                                    <textarea
                                        value={homeworkInstructions}
                                        onChange={(e) => setHomeworkInstructions(e.target.value)}
                                        rows={5}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-amber-300 focus:ring"
                                        placeholder="Describe qué debe subir el estudiante (PDF, Word, ZIP o RAR) y criterios esperados."
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={homeworkSaving || !(homeworkCan.edit || homeworkCan.create)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                                    >
                                        {homeworkSaving ? 'Guardando…' : lesson.has_homework ? 'Actualizar tarea' : 'Guardar tarea'}
                                    </button>
                                </div>
                            </form>
                        ) : null}
                    </LessonMaterialsSection>
                ) : null}

                {/* Vídeo principal (1:1) — mismo patrón visual que Documentos */}
                <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Video className="size-5 text-amber-600" />
                            <h2 className="text-sm font-semibold text-slate-800">Vídeo principal</h2>
                        </div>
                        {videoCan.create && !video && (
                            <button
                                type="button"
                                onClick={() => setVideoModalOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                            >
                                <Plus className="size-3.5" />
                                Configurar vídeo
                            </button>
                        )}
                    </div>

                    {!videoCan.view ? (
                        <p className="text-sm text-amber-900">
                            No tienes permiso para ver el vídeo de la lección (
                            <code className="rounded bg-amber-100 px-1 text-xs">cursos_lecciones_videos.view</code>).
                        </p>
                    ) : !video ? (
                        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
                            {videoCan.create
                                ? 'No hay vídeo configurado. Una lección solo puede tener un vídeo principal (subida propia o enlace externo).'
                                : 'No hay vídeo en esta lección.'}
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            <li className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2">
                                <div className="flex w-8 flex-col items-center">
                                    <span className="text-[10px] font-bold text-slate-500">1</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-800">Vídeo principal</p>
                                    <p className="truncate text-xs text-slate-500">
                                        {VIDEO_SOURCE_LABEL[video.video_source] ?? video.video_source}
                                        {' · '}
                                        {formatDurationSec(video.duration_seconds)}
                                        {video.video_source === 'upload' && video.processing_status
                                            ? ` · ${video.processing_status}`
                                            : ''}
                                        {video.video_source === 'upload' && video.original_filename
                                            ? ` · ${video.original_filename}`
                                            : ''}
                                        {video.video_source === 'upload'
                                            ? ` · ${formatBytes(video.file_size_bytes)}`
                                            : video.external_url
                                              ? ` · ${video.external_url}`
                                              : ''}
                                    </p>
                                </div>
                                {video.video_source === 'upload' && video.storage_path ? (
                                    <a
                                        href={`/storage/${video.storage_path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                                    >
                                        <ExternalLink className="size-3" />
                                        Abrir
                                    </a>
                                ) : video.external_url ? (
                                    <a
                                        href={video.external_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                                    >
                                        <ExternalLink className="size-3" />
                                        Abrir
                                    </a>
                                ) : null}
                                {videoCan.edit && (
                                    <button
                                        type="button"
                                        title="Editar"
                                        onClick={() => setVideoModalOpen(true)}
                                        className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-50"
                                    >
                                        <Pencil className="size-3.5" />
                                    </button>
                                )}
                                {videoCan.delete && (
                                    <button
                                        type="button"
                                        title="Eliminar"
                                        onClick={() => setVideoDeleteOpen(true)}
                                        className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                )}
                            </li>
                        </ul>
                    )}
                </section>

                {/* Documentos */}
                <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <FileText className="size-5 text-amber-600" />
                            <h2 className="text-sm font-semibold text-slate-800">Documentos</h2>
                        </div>
                        {documentsCan.create && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingDoc(null);
                                    setDocModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                            >
                                <Plus className="size-3.5" />
                                Subir documento
                            </button>
                        )}
                    </div>

                    {!documentsCan.view ? (
                        <p className="text-sm text-amber-900">
                            No tienes permiso para ver documentos de lección (
                            <code className="rounded bg-amber-100 px-1 text-xs">cursos_lecciones_documentos.view</code>).
                        </p>
                    ) : sortedDocs.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
                            {documentsCan.create
                                ? 'No hay documentos. Sube el primero con el botón superior.'
                                : 'No hay documentos en esta lección.'}
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {sortedDocs.map((d, index) => (
                                <li
                                    key={d.id}
                                    className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2"
                                >
                                    <div className="flex w-8 flex-col items-center">
                                        <span className="text-[10px] font-bold text-slate-500">{d.sort_order}</span>
                                        {documentsCan.edit && sortedDocs.length > 1 && (
                                            <div className="flex flex-col">
                                                <button
                                                    type="button"
                                                    disabled={index === 0}
                                                    onClick={() => moveDoc(index, -1)}
                                                    className={cn(
                                                        'rounded p-0.5 text-slate-400 hover:bg-white',
                                                        index === 0 && 'opacity-30',
                                                    )}
                                                >
                                                    <ArrowUp className="size-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={index === sortedDocs.length - 1}
                                                    onClick={() => moveDoc(index, 1)}
                                                    className={cn(
                                                        'rounded p-0.5 text-slate-400 hover:bg-white',
                                                        index === sortedDocs.length - 1 && 'opacity-30',
                                                    )}
                                                >
                                                    <ArrowDown className="size-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-800">{d.title}</p>
                                        <p className="text-xs text-slate-500">
                                            {d.original_filename} · {formatBytes(d.file_size_bytes)}
                                            {d.is_downloadable ? '' : ' · solo lectura'}
                                        </p>
                                    </div>
                                    <a
                                        href={`/storage/${d.file_path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                                    >
                                        <ExternalLink className="size-3" />
                                        Abrir
                                    </a>
                                    {documentsCan.edit && (
                                        <button
                                            type="button"
                                            title="Editar"
                                            onClick={() => {
                                                setEditingDoc(d);
                                                setDocModalOpen(true);
                                            }}
                                            className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-50"
                                        >
                                            <Pencil className="size-3.5" />
                                        </button>
                                    )}
                                    {documentsCan.delete && (
                                        <button
                                            type="button"
                                            title="Eliminar"
                                            onClick={() => {
                                                setDocPending(d);
                                                setDocDeleteOpen(true);
                                            }}
                                            className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Recursos */}
                <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Layers className="size-5 text-teal-600" />
                            <h2 className="text-sm font-semibold text-slate-800">Recursos (enlaces)</h2>
                        </div>
                        {resourcesCan.create && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingRes(null);
                                    setResModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                            >
                                <Plus className="size-3.5" />
                                Añadir recurso
                            </button>
                        )}
                    </div>

                    {!resourcesCan.view ? (
                        <p className="text-sm text-amber-900">
                            No tienes permiso para ver recursos de lección (
                            <code className="rounded bg-amber-100 px-1 text-xs">cursos_lecciones_recursos.view</code>).
                        </p>
                    ) : sortedRes.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
                            {resourcesCan.create
                                ? 'No hay enlaces. Añade documentación externa, repos o descargas.'
                                : 'No hay recursos en esta lección.'}
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {sortedRes.map((r, index) => (
                                <li
                                    key={r.id}
                                    className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2"
                                >
                                    <div className="flex w-8 flex-col items-center">
                                        <span className="text-[10px] font-bold text-slate-500">{r.sort_order}</span>
                                        {resourcesCan.edit && sortedRes.length > 1 && (
                                            <div className="flex flex-col">
                                                <button
                                                    type="button"
                                                    disabled={index === 0}
                                                    onClick={() => moveRes(index, -1)}
                                                    className={cn(
                                                        'rounded p-0.5 text-slate-400 hover:bg-white',
                                                        index === 0 && 'opacity-30',
                                                    )}
                                                >
                                                    <ArrowUp className="size-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={index === sortedRes.length - 1}
                                                    onClick={() => moveRes(index, 1)}
                                                    className={cn(
                                                        'rounded p-0.5 text-slate-400 hover:bg-white',
                                                        index === sortedRes.length - 1 && 'opacity-30',
                                                    )}
                                                >
                                                    <ArrowDown className="size-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-800">{r.title}</p>
                                        <p className="truncate text-xs text-slate-500">
                                            <span className="rounded bg-white px-1 font-medium text-teal-700">
                                                {r.resource_type}
                                            </span>{' '}
                                            {r.url}
                                        </p>
                                    </div>
                                    <a
                                        href={r.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                                    >
                                        <ExternalLink className="size-3" />
                                        Ir
                                    </a>
                                    {resourcesCan.edit && (
                                        <button
                                            type="button"
                                            title="Editar"
                                            onClick={() => {
                                                setEditingRes(r);
                                                setResModalOpen(true);
                                            }}
                                            className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-50"
                                        >
                                            <Pencil className="size-3.5" />
                                        </button>
                                    )}
                                    {resourcesCan.delete && (
                                        <button
                                            type="button"
                                            title="Eliminar"
                                            onClick={() => {
                                                setResPending(r);
                                                setResDeleteOpen(true);
                                            }}
                                            className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            <LessonVideoFormModal
                open={videoModalOpen}
                onClose={() => setVideoModalOpen(false)}
                courseId={course.id}
                moduleId={module.id}
                lessonId={lesson.id}
                video={video}
            />

            <LessonDocumentFormModal
                open={docModalOpen}
                onClose={() => {
                    setDocModalOpen(false);
                    setEditingDoc(null);
                }}
                courseId={course.id}
                moduleId={module.id}
                lessonId={lesson.id}
                document={editingDoc}
            />

            <LessonResourceFormModal
                open={resModalOpen}
                onClose={() => {
                    setResModalOpen(false);
                    setEditingRes(null);
                }}
                courseId={course.id}
                moduleId={module.id}
                lessonId={lesson.id}
                resource={editingRes}
            />

            <ConfirmModal
                open={videoDeleteOpen}
                onClose={() => {
                    if (!videoDeleting) {
                        setVideoDeleteOpen(false);
                    }
                }}
                onConfirm={confirmDeleteVideo}
                loading={videoDeleting}
                title="Quitar vídeo de la lección"
                description="Se eliminará la configuración del vídeo. Si había un archivo subido, también se borrará del almacenamiento."
                confirmLabel="Sí, quitar"
            />

            <ConfirmModal
                open={docDeleteOpen}
                onClose={() => {
                    if (!docDeleting) {
                        setDocDeleteOpen(false);
                        setDocPending(null);
                    }
                }}
                onConfirm={confirmDeleteDoc}
                loading={docDeleting}
                title="Eliminar documento"
                description={
                    <>
                        ¿Eliminar <span className="font-semibold">«{docPending?.title}»</span> del almacenamiento?
                    </>
                }
                confirmLabel="Sí, eliminar"
            />

            <ConfirmModal
                open={resDeleteOpen}
                onClose={() => {
                    if (!resDeleting) {
                        setResDeleteOpen(false);
                        setResPending(null);
                    }
                }}
                onConfirm={confirmDeleteRes}
                loading={resDeleting}
                title="Eliminar recurso"
                description={
                    <>
                        ¿Eliminar el enlace <span className="font-semibold">«{resPending?.title}»</span>?
                    </>
                }
                confirmLabel="Sí, eliminar"
            />
        </>
    );
}

LessonMaterialsPage.layout = (pageProps: Props) => ({
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Cursos', href: coursesRoute.index.url() },
        {
            title: `Módulos · ${pageProps.course.title}`,
            href: coursesRoute.modules.index.url({ course: pageProps.course.id }),
        },
        {
            title: `Materiales · ${pageProps.lesson.title}`,
            href: coursesRoute.modules.lessons.materials.show.url({
                course: pageProps.course.id,
                course_module: pageProps.module.id,
                lesson: pageProps.lesson.id,
            }),
        },
    ],
});
