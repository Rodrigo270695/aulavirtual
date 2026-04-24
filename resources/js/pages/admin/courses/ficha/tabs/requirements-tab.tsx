/**
 * Tab: requisitos previos (course_requirements).
 */

import { FichaItemsEditor } from '@/pages/admin/courses/ficha/ficha-items-editor';
import type { CourseFichaCourse } from '@/types';

interface Props {
    course: CourseFichaCourse;
    updateUrl: string;
    canEdit: boolean;
}

export function RequirementsTab({ course, updateUrl, canEdit }: Props) {
    return (
        <FichaItemsEditor
            sectionTitle="Requisitos previos"
            helperText="Conocimientos o experiencia que el alumno debe tener antes de tomar el curso (p. ej. «Álgebra básica», «Uso de Excel»)."
            initialItems={course.requirements}
            updateUrl={updateUrl}
            canEdit={canEdit}
        />
    );
}
