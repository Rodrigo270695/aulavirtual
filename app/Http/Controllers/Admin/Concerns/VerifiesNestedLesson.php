<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\LessonDocument;
use App\Models\LessonResource;
use App\Models\Quiz;
use App\Models\QuizQuestion;

trait VerifiesNestedLesson
{
    protected function assertLessonContext(Course $course, CourseModule $courseModule, Lesson $lesson): void
    {
        if ($courseModule->course_id !== $course->id || $lesson->module_id !== $courseModule->id || $lesson->course_id !== $course->id) {
            abort(404);
        }
    }

    protected function assertDocumentBelongsToLesson(Lesson $lesson, LessonDocument $document): void
    {
        if ($document->lesson_id !== $lesson->id) {
            abort(404);
        }
    }

    protected function assertResourceBelongsToLesson(Lesson $lesson, LessonResource $resource): void
    {
        if ($resource->lesson_id !== $lesson->id) {
            abort(404);
        }
    }

    protected function assertQuizBelongsToLesson(Lesson $lesson, Quiz $quiz): void
    {
        if ($quiz->lesson_id !== $lesson->id) {
            abort(404);
        }
    }

    protected function assertQuizQuestionBelongsToLesson(Lesson $lesson, Quiz $quiz, QuizQuestion $question): void
    {
        $this->assertQuizBelongsToLesson($lesson, $quiz);
        if ($question->quiz_id !== $quiz->id) {
            abort(404);
        }
    }
}
