<?php

namespace App\Http\Controllers\Learning;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonHomeworkDeliverable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\File;

class LessonHomeworkDeliverableController extends Controller
{
    private const MAX_FILES_PER_LESSON = 15;

    public function store(Request $request, Enrollment $enrollment, Lesson $lesson): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless($user->can('learning_tareas_entregas.create'), 403);
        abort_unless($enrollment->user_id === $user->id && $enrollment->status === 'active', 403);
        abort_unless($enrollment->course_id !== null && $lesson->course_id === $enrollment->course_id, 404);
        abort_unless($lesson->is_published, 404);
        abort_unless($lesson->has_homework, 404);

        $existing = LessonHomeworkDeliverable::query()
            ->where('enrollment_id', $enrollment->id)
            ->where('lesson_id', $lesson->id)
            ->count();

        if ($existing >= self::MAX_FILES_PER_LESSON) {
            return response()->json([
                'ok' => false,
                'message' => 'Has alcanzado el máximo de archivos permitidos para esta entrega ('.self::MAX_FILES_PER_LESSON.').',
            ], 422);
        }

        $validated = $request->validate([
            'file' => ['required', 'file', File::types(['pdf', 'doc', 'docx', 'zip', 'rar'])->max(25600)],
        ]);

        $upload = $validated['file'];
        $path = $upload->store('homework-deliverables/'.$enrollment->id.'/'.$lesson->id, 'public');

        $row = LessonHomeworkDeliverable::create([
            'enrollment_id' => $enrollment->id,
            'lesson_id' => $lesson->id,
            'user_id' => $user->id,
            'file_path' => $path,
            'original_filename' => $upload->getClientOriginalName(),
            'file_size_bytes' => $upload->getSize(),
            'mime_type' => $upload->getClientMimeType(),
        ]);

        return response()->json([
            'ok' => true,
            'deliverable' => [
                'id' => $row->id,
                'title' => $row->original_filename,
                'url' => asset('storage/'.$row->file_path),
            ],
        ]);
    }

    public function destroy(
        Request $request,
        Enrollment $enrollment,
        Lesson $lesson,
        LessonHomeworkDeliverable $homework,
    ): JsonResponse {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless($user->can('learning_tareas_entregas.delete'), 403);
        abort_unless($enrollment->user_id === $user->id && $enrollment->status === 'active', 403);
        abort_unless($enrollment->course_id !== null && $lesson->course_id === $enrollment->course_id, 404);
        abort_unless($homework->enrollment_id === $enrollment->id && $homework->lesson_id === $lesson->id, 404);
        abort_unless((string) $homework->user_id === (string) $user->id, 403);

        Storage::disk('public')->delete($homework->file_path);
        $homework->delete();

        return response()->json(['ok' => true]);
    }
}
