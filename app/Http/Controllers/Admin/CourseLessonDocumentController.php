<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\VerifiesNestedLesson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CourseLessonDocumentRequest;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\LessonDocument;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CourseLessonDocumentController extends Controller
{
    use VerifiesNestedLesson;

    public function store(CourseLessonDocumentRequest $request, Course $course, CourseModule $courseModule, Lesson $lesson): RedirectResponse
    {
        $this->authorize('cursos_lecciones_documentos.create');
        $this->assertLessonContext($course, $courseModule, $lesson);

        $file = $request->file('file');
        $path = $file->store('lesson-documents/'.$lesson->id, 'public');

        LessonDocument::create([
            'lesson_id' => $lesson->id,
            'title' => $request->validated('title'),
            'file_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'file_size_bytes' => $file->getSize(),
            'mime_type' => $file->getClientMimeType(),
            'is_downloadable' => $request->boolean('is_downloadable', true),
            'sort_order' => (int) $lesson->documents()->max('sort_order') + 1,
        ]);

        return back()->with('success', 'Documento añadido correctamente.');
    }

    public function update(
        CourseLessonDocumentRequest $request,
        Course $course,
        CourseModule $courseModule,
        Lesson $lesson,
        LessonDocument $lessonDocument,
    ): RedirectResponse {
        $this->authorize('cursos_lecciones_documentos.edit');
        $this->assertLessonContext($course, $courseModule, $lesson);
        $this->assertDocumentBelongsToLesson($lesson, $lessonDocument);

        $data = $request->validated();

        if ($request->hasFile('file')) {
            Storage::disk('public')->delete($lessonDocument->file_path);
            $file = $request->file('file');
            $path = $file->store('lesson-documents/'.$lesson->id, 'public');
            $data['file_path'] = $path;
            $data['original_filename'] = $file->getClientOriginalName();
            $data['file_size_bytes'] = $file->getSize();
            $data['mime_type'] = $file->getClientMimeType();
        }

        unset($data['file']);
        $lessonDocument->update($data);

        return back()->with('success', 'Documento actualizado correctamente.');
    }

    public function destroy(
        Course $course,
        CourseModule $courseModule,
        Lesson $lesson,
        LessonDocument $lessonDocument,
    ): RedirectResponse {
        $this->authorize('cursos_lecciones_documentos.delete');
        $this->assertLessonContext($course, $courseModule, $lesson);
        $this->assertDocumentBelongsToLesson($lesson, $lessonDocument);

        Storage::disk('public')->delete($lessonDocument->file_path);
        $lessonDocument->delete();
        $this->renumberDocumentSortOrder($lesson);

        return back()->with('success', 'Documento eliminado correctamente.');
    }

    public function reorder(Request $request, Course $course, CourseModule $courseModule, Lesson $lesson): RedirectResponse
    {
        $this->authorize('cursos_lecciones_documentos.edit');
        $this->assertLessonContext($course, $courseModule, $lesson);

        $validated = $request->validate([
            'order' => ['required', 'array', 'min:1'],
            'order.*' => ['uuid', 'distinct'],
        ]);

        $ids = $validated['order'];
        $total = $lesson->documents()->count();

        if (count($ids) !== $total) {
            return back()->with('error', 'Debes enviar todos los documentos de la lección en el nuevo orden.');
        }

        $existing = $lesson->documents()->whereIn('id', $ids)->pluck('id')->all();

        if (count($existing) !== count($ids)) {
            return back()->with('error', 'El orden enviado no coincide con los documentos de la lección.');
        }

        DB::transaction(function () use ($lesson, $ids): void {
            foreach ($ids as $index => $id) {
                LessonDocument::query()
                    ->where('lesson_id', $lesson->id)
                    ->where('id', $id)
                    ->update(['sort_order' => $index + 1]);
            }
        });

        return back()->with('success', 'Orden de documentos actualizado.');
    }

    private function renumberDocumentSortOrder(Lesson $lesson): void
    {
        $rows = $lesson->documents()->orderBy('sort_order')->orderBy('created_at')->get();
        foreach ($rows as $index => $row) {
            $row->update(['sort_order' => $index + 1]);
        }
    }
}
