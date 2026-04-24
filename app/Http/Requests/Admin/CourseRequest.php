<?php

namespace App\Http\Requests\Admin;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class CourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_free' => $this->boolean('is_free'),
            'certificate_enabled' => $this->boolean('certificate_enabled'),
            'remove_promo_video' => $this->boolean('remove_promo_video'),
            'remove_cover' => $this->boolean('remove_cover'),
        ]);

        $kind = $this->input('promo_video_input');

        if (! in_array($kind, ['link', 'upload'], true)) {
            $this->merge(['promo_video_input' => 'link']);
        }

        if ($this->filled('title') && ! $this->filled('slug')) {
            $this->merge(['slug' => Str::slug($this->input('title'))]);
        }

        if ($this->boolean('is_free')) {
            $this->merge(['price' => 0]);
        }

        if ($this->has('tags') && is_array($this->input('tags'))) {
            $clean = collect($this->input('tags'))
                ->map(fn ($t) => mb_strtolower(trim((string) $t)))
                ->filter(fn ($t) => $t !== '')
                ->values()
                ->all();
            $this->merge(['tags' => $clean]);
        } else {
            $this->merge(['tags' => []]);
        }
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if ($this->route('course')) {
                return;
            }

            if ($this->input('promo_video_input') !== 'upload') {
                return;
            }

            if ($this->hasFile('promo_video_file')) {
                return;
            }

            $v->errors()->add('promo_video_file', 'Sube un archivo de vídeo o elige «Enlace externo».');
        });
    }

    public function rules(): array
    {
        /** @var Course|null $course */
        $course = $this->route('course');
        $courseId = $course?->getKey();

        return [
            'instructor_id' => ['required', 'uuid', Rule::exists('instructors', 'id')],
            'category_id'   => ['required', 'uuid', Rule::exists('categories', 'id')],
            'title'         => ['required', 'string', 'max:255'],
            'slug'          => [
                'required',
                'string',
                'max:300',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('courses', 'slug')->ignore($courseId),
            ],
            'subtitle'    => ['nullable', 'string', 'max:400'],
            'description' => ['required', 'string'],
            'language'    => ['nullable', 'string', 'max:10'],
            'level'       => ['required', 'string', Rule::in(['beginner', 'intermediate', 'advanced', 'all_levels'])],
            'status'      => ['required', 'string', Rule::in(['draft', 'under_review', 'published', 'unpublished', 'archived'])],
            'promo_video_input' => ['required', Rule::in(['link', 'upload'])],
            'promo_video_url' => ['nullable', 'string', 'max:500'],
            'promo_video_file' => [
                'nullable',
                'file',
                'max:102400',
                'mimetypes:video/mp4,video/webm,video/quicktime,video/x-msvideo,video/3gpp',
            ],
            'remove_promo_video' => ['boolean'],
            'cover_image_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'remove_cover' => ['boolean'],
            'price'       => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'is_free'     => ['boolean'],
            'currency'    => ['nullable', 'string', 'size:3'],
            'certificate_enabled' => ['boolean'],
            'tags' => ['sometimes', 'array'],
            'tags.*' => ['string', 'max:80'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'El título es obligatorio.',
            'slug.required' => 'El slug es obligatorio.',
            'slug.unique'   => 'Ese slug ya está en uso.',
            'slug.regex'    => 'El slug solo puede contener letras minúsculas, números y guiones.',
            'instructor_id.required' => 'Selecciona un instructor.',
            'instructor_id.exists'   => 'El instructor no existe.',
            'category_id.required'   => 'Selecciona una categoría.',
            'category_id.exists'     => 'La categoría no existe.',
            'description.required'   => 'La descripción es obligatoria.',
            'promo_video_file.max'   => 'El vídeo no puede superar 100 MB.',
            'promo_video_file.mimetypes' => 'Formato de vídeo no permitido (usa MP4, WebM, MOV, AVI o 3GP).',
            'cover_image_file.image' => 'La portada debe ser una imagen válida.',
            'cover_image_file.mimes' => 'La portada debe estar en formato JPG, PNG, WebP o GIF.',
            'cover_image_file.max'   => 'La portada no puede superar 5 MB.',
        ];
    }
}
