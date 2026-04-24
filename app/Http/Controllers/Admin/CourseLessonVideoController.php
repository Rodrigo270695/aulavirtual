<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\VerifiesNestedLesson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CourseLessonVideoRequest;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\LessonVideo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;

class CourseLessonVideoController extends Controller
{
    use VerifiesNestedLesson;

    public function store(CourseLessonVideoRequest $request, Course $course, CourseModule $courseModule, Lesson $lesson): RedirectResponse
    {
        $this->authorize('cursos_lecciones_videos.create');
        $this->assertLessonContext($course, $courseModule, $lesson);

        abort_if($lesson->video()->exists(), 403, 'Esta lección ya tiene un vídeo configurado. Usa «Actualizar».');

        $lesson->loadMissing('video');
        $this->persistVideo($request, $lesson, null);

        return back()->with('success', 'Vídeo de la lección guardado correctamente.');
    }

    public function update(CourseLessonVideoRequest $request, Course $course, CourseModule $courseModule, Lesson $lesson): RedirectResponse
    {
        $this->authorize('cursos_lecciones_videos.edit');
        $this->assertLessonContext($course, $courseModule, $lesson);

        $video = $lesson->video;
        abort_if($video === null, 404);

        $this->persistVideo($request, $lesson, $video);

        return back()->with('success', 'Vídeo de la lección actualizado correctamente.');
    }

    public function destroy(Course $course, CourseModule $courseModule, Lesson $lesson): RedirectResponse
    {
        $this->authorize('cursos_lecciones_videos.delete');
        $this->assertLessonContext($course, $courseModule, $lesson);

        $video = $lesson->video;
        abort_if($video === null, 404);

        if ($video->storage_path) {
            Storage::disk('public')->delete($video->storage_path);
        }
        if ($video->thumbnail_path) {
            Storage::disk('public')->delete($video->thumbnail_path);
        }

        $video->delete();

        return back()->with('success', 'Vídeo de la lección eliminado.');
    }

    private function persistVideo(CourseLessonVideoRequest $request, Lesson $lesson, ?LessonVideo $existing): void
    {
        $data = $request->validated();
        unset($data['file']);

        $source = $data['video_source'];

        if ($source === 'upload') {
            $payload = [
                'lesson_id' => $lesson->id,
                'video_source' => 'upload',
                'external_url' => null,
                'external_embed_url' => null,
                'external_provider_video_id' => null,
                'duration_seconds' => (int) $data['duration_seconds'],
                'processing_status' => 'completed',
                'processing_error' => null,
                'processed_at' => now(),
                'streaming_url' => null,
                'resolution_480p' => null,
                'resolution_720p' => null,
                'resolution_1080p' => null,
                'codec' => null,
            ];

            if ($request->hasFile('file')) {
                if ($existing?->storage_path) {
                    Storage::disk('public')->delete($existing->storage_path);
                }
                $file = $request->file('file');
                $path = $file->store('lesson-videos/'.$lesson->id, 'public');
                $payload['storage_path'] = $path;
                $payload['original_filename'] = $file->getClientOriginalName();
                $payload['file_size_bytes'] = $file->getSize();
            } elseif ($existing) {
                $payload['storage_path'] = $existing->storage_path;
                $payload['original_filename'] = $existing->original_filename;
                $payload['file_size_bytes'] = $existing->file_size_bytes;
            }

            if ($existing) {
                $existing->update($payload);
            } else {
                LessonVideo::create($payload);
            }

            return;
        }

        if ($existing?->storage_path) {
            Storage::disk('public')->delete($existing->storage_path);
        }
        if ($existing?->thumbnail_path) {
            Storage::disk('public')->delete($existing->thumbnail_path);
        }

        $payload = [
            'lesson_id' => $lesson->id,
            'video_source' => $source,
            'external_url' => $data['external_url'],
            'external_embed_url' => $data['external_embed_url'] ?? null,
            'external_provider_video_id' => $data['external_provider_video_id'] ?? null,
            'original_filename' => null,
            'storage_path' => null,
            'streaming_url' => null,
            'thumbnail_path' => null,
            'file_size_bytes' => null,
            'duration_seconds' => (int) $data['duration_seconds'],
            'resolution_480p' => null,
            'resolution_720p' => null,
            'resolution_1080p' => null,
            'codec' => null,
            'processing_status' => 'not_applicable',
            'processing_error' => null,
            'processed_at' => null,
        ];

        if ($existing) {
            $existing->update($payload);
        } else {
            LessonVideo::create($payload);
        }
    }
}
