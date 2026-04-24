/**
 * Tab: público objetivo (course_target_audiences).
 */

import { FichaItemsEditor } from '@/pages/admin/courses/ficha/ficha-items-editor';
import type { CourseFichaCourse } from '@/types';

interface Props {
    course: CourseFichaCourse;
    updateUrl: string;
    canEdit: boolean;
}

export function TargetAudienceTab({ course, updateUrl, canEdit }: Props) {
    return (
        <FichaItemsEditor
            sectionTitle="Público objetivo"
            helperText="Perfiles a los que va dirigido el curso (p. ej. «Estudiantes de ingeniería civil», «Profesionales en transición de carrera»)."
            initialItems={course.target_audiences}
            updateUrl={updateUrl}
            canEdit={canEdit}
        />
    );
}
