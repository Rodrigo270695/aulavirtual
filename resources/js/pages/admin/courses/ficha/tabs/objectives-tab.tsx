/**
 * Tab: objetivos de aprendizaje (course_objectives).
 */

import { FichaItemsEditor } from '@/pages/admin/courses/ficha/ficha-items-editor';
import type { CourseFichaCourse } from '@/types';

interface Props {
    course: CourseFichaCourse;
    updateUrl: string;
    canEdit: boolean;
}

export function ObjectivesTab({ course, updateUrl, canEdit }: Props) {
    return (
        <FichaItemsEditor
            sectionTitle="Objetivos de aprendizaje"
            helperText="Lo que el estudiante sabrá o sabrá hacer al terminar. Usa verbos de acción (p. ej. «Calcular…», «Diseñar…», «Interpretar…»)."
            initialItems={course.objectives}
            updateUrl={updateUrl}
            canEdit={canEdit}
        />
    );
}
