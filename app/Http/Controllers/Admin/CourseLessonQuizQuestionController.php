<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\VerifiesNestedLesson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CourseLessonQuizQuestionRequest;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\QuizQuestion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CourseLessonQuizQuestionController extends Controller
{
    use VerifiesNestedLesson;

    public function store(
        CourseLessonQuizQuestionRequest $request,
        Course $course,
        CourseModule $courseModule,
        Lesson $lesson,
    ): RedirectResponse {
        $this->authorize('cursos_lecciones_quizzes.edit');
        $this->assertLessonContext($course, $courseModule, $lesson);

        abort_unless($lesson->lesson_type === 'quiz', 404);

        $quiz = $lesson->quiz;
        abort_if($quiz === null, 403, 'Crea primero el cuestionario (cabecera) antes de añadir preguntas.');

        $data = $request->validated();
        $options = $data['options'] ?? [];
        unset($data['options']);

        $data['sort_order'] = $data['sort_order'] ?? ((int) $quiz->questions()->max('sort_order') + 1);

        DB::transaction(function () use ($data, $options, $quiz): void {
            $question = $quiz->questions()->create($data);
            $this->syncOptions($question, $options);
        });

        return back()->with('success', 'Pregunta añadida.');
    }

    public function update(
        CourseLessonQuizQuestionRequest $request,
        Course $course,
        CourseModule $courseModule,
        Lesson $lesson,
        QuizQuestion $quizQuestion,
    ): RedirectResponse {
        $this->authorize('cursos_lecciones_quizzes.edit');
        $this->assertLessonContext($course, $courseModule, $lesson);

        abort_unless($lesson->lesson_type === 'quiz', 404);

        $quiz = $lesson->quiz;
        abort_if($quiz === null, 404);
        $this->assertQuizQuestionBelongsToLesson($lesson, $quiz, $quizQuestion);

        $data = $request->validated();
        $options = $data['options'] ?? [];
        unset($data['options']);

        DB::transaction(function () use ($quizQuestion, $data, $options): void {
            $quizQuestion->update($data);
            $quizQuestion->options()->delete();
            $this->syncOptions($quizQuestion, $options);
        });

        return back()->with('success', 'Pregunta actualizada.');
    }

    public function destroy(
        Course $course,
        CourseModule $courseModule,
        Lesson $lesson,
        QuizQuestion $quizQuestion,
    ): RedirectResponse {
        $this->authorize('cursos_lecciones_quizzes.edit');
        $this->assertLessonContext($course, $courseModule, $lesson);

        abort_unless($lesson->lesson_type === 'quiz', 404);

        $quiz = $lesson->quiz;
        abort_if($quiz === null, 404);
        $this->assertQuizQuestionBelongsToLesson($lesson, $quiz, $quizQuestion);

        $quizQuestion->delete();
        $this->renumberQuestionSortOrder($quiz);

        return back()->with('success', 'Pregunta eliminada.');
    }

    public function reorder(Request $request, Course $course, CourseModule $courseModule, Lesson $lesson): RedirectResponse
    {
        $this->authorize('cursos_lecciones_quizzes.edit');
        $this->assertLessonContext($course, $courseModule, $lesson);

        abort_unless($lesson->lesson_type === 'quiz', 404);

        $quiz = $lesson->quiz;
        abort_if($quiz === null, 404);

        $validated = $request->validate([
            'order' => ['required', 'array', 'min:1'],
            'order.*' => ['uuid', 'distinct'],
        ]);

        $ids = $validated['order'];
        $total = $quiz->questions()->count();

        if (count($ids) !== $total) {
            return back()->with('error', 'Debes enviar todas las preguntas del cuestionario en el nuevo orden.');
        }

        $existing = $quiz->questions()->whereIn('id', $ids)->pluck('id')->all();

        if (count($existing) !== count($ids)) {
            return back()->with('error', 'El orden enviado no coincide con las preguntas de este cuestionario.');
        }

        DB::transaction(function () use ($quiz, $ids): void {
            foreach ($ids as $index => $id) {
                QuizQuestion::query()
                    ->where('quiz_id', $quiz->id)
                    ->where('id', $id)
                    ->update(['sort_order' => $index + 1]);
            }
        });

        return back()->with('success', 'Orden de preguntas actualizado.');
    }

    /**
     * @param  array<int, array{option_text: string, is_correct: bool, explanation?: string|null, sort_order?: int|null}>  $options
     */
    private function syncOptions(QuizQuestion $question, array $options): void
    {
        foreach ($options as $index => $opt) {
            $question->options()->create([
                'option_text' => $opt['option_text'],
                'is_correct' => (bool) ($opt['is_correct'] ?? false),
                'explanation' => $opt['explanation'] ?? null,
                'sort_order' => $opt['sort_order'] ?? $index + 1,
            ]);
        }
    }

    private function renumberQuestionSortOrder(\App\Models\Quiz $quiz): void
    {
        $questions = $quiz->questions()->orderBy('sort_order')->orderBy('created_at')->get();
        foreach ($questions as $index => $q) {
            $q->update(['sort_order' => $index + 1]);
        }
    }
}
