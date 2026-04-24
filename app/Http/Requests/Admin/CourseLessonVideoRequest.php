<?php

namespace App\Http\Requests\Admin;

use App\Models\Lesson;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class CourseLessonVideoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function lesson(): Lesson
    {
        $lesson = $this->route('lesson');
        if (! $lesson instanceof Lesson) {
            abort(404);
        }

        return $lesson;
    }

    protected function isUpdating(): bool
    {
        $lesson = $this->lesson();
        $lesson->loadMissing('video');

        return $lesson->video !== null;
    }

    public function rules(): array
    {
        $source = $this->input('video_source');

        $rules = [
            'video_source' => ['required', Rule::in(['upload', 'youtube', 'vimeo', 'external'])],
            'duration_seconds' => ['required', 'integer', 'min:0', 'max:864000'],
            'external_url' => ['nullable', 'string', 'max:1000'],
            'external_embed_url' => ['nullable', 'string', 'max:1000'],
            'external_provider_video_id' => ['nullable', 'string', 'max:100'],
        ];

        if (in_array($source, ['youtube', 'vimeo', 'external'], true)) {
            $rules['external_url'] = ['required', 'string', 'max:1000'];
            $rules['file'] = ['prohibited'];
        } else {
            $rules['file'] = array_merge(
                $this->isUpdating() ? ['sometimes', 'nullable'] : ['required'],
                ['file', 'max:102400', 'mimetypes:video/mp4,video/webm,video/quicktime,video/x-msvideo,video/3gpp'],
            );
        }

        return $rules;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            if ($this->input('video_source') !== 'upload') {
                return;
            }

            $lesson = $this->lesson();
            $lesson->loadMissing('video');
            $prev = $lesson->video;

            if ($this->hasFile('file')) {
                return;
            }

            if ($prev && $prev->video_source === 'upload' && $prev->storage_path) {
                return;
            }

            $validator->errors()->add(
                'file',
                $prev && $prev->video_source !== 'upload'
                    ? 'Sube un archivo de vídeo al cambiar a alojamiento propio.'
                    : 'Debes subir un archivo de vídeo.',
            );
        });
    }

    public function messages(): array
    {
        return [
            'video_source.required' => 'Indica el origen del vídeo.',
            'duration_seconds.required' => 'La duración en segundos es obligatoria.',
            'external_url.required' => 'La URL del vídeo es obligatoria para este origen.',
            'file.required' => 'Debes seleccionar un archivo de vídeo.',
            'file.prohibited' => 'No debes adjuntar archivo cuando el origen es externo.',
            'file.max' => 'El vídeo no puede superar 100 MB.',
            'file.mimetypes' => 'Formato no permitido (usa MP4, WebM, MOV, AVI o 3GP).',
        ];
    }
}
