<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SpecializationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('title') && ! $this->filled('slug')) {
            $this->merge(['slug' => Str::slug($this->string('title'))]);
        }

        foreach (['cover_image', 'promo_video_url', 'discount_price', 'discount_ends_at'] as $key) {
            if ($this->has($key) && $this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }

        if ($this->has('discount_ends_at') && $this->filled('discount_ends_at')) {
            $raw = (string) $this->input('discount_ends_at');
            if (strlen($raw) === 16 && str_contains($raw, 'T')) {
                $this->merge(['discount_ends_at' => $raw.':00']);
            }
        }

        $courses = $this->input('courses');
        if (! is_array($courses)) {
            $this->merge(['courses' => []]);

            return;
        }

        $normalized = collect($courses)
            ->filter(fn ($row) => is_array($row) && ! empty($row['course_id']))
            ->map(fn (array $row) => [
                'course_id'   => (string) $row['course_id'],
                'is_required' => filter_var($row['is_required'] ?? true, FILTER_VALIDATE_BOOLEAN),
            ])
            ->values()
            ->all();

        $this->merge(['courses' => $normalized]);
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $courses = $this->input('courses', []);
            if (! is_array($courses)) {
                return;
            }

            $ids = collect($courses)->pluck('course_id')->filter()->all();
            if (count($ids) !== count(array_unique($ids))) {
                $v->errors()->add('courses', 'No puedes incluir el mismo curso más de una vez en la ruta.');
            }
        });
    }

    public function rules(): array
    {
        /** @var \App\Models\Specialization|null $spec */
        $spec = $this->route('specialization');
        $specId = $spec?->getKey();

        return [
            'instructor_id' => ['required', 'uuid', Rule::exists('instructors', 'id')],
            'category_id'   => ['required', 'uuid', Rule::exists('categories', 'id')],
            'title'         => ['required', 'string', 'max:255'],
            'slug'          => [
                'required',
                'string',
                'max:300',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('specializations', 'slug')->ignore($specId),
            ],
            'description'   => ['required', 'string'],
            'cover_image'   => ['nullable', 'string', 'max:500'],
            'promo_video_url' => ['nullable', 'string', 'max:500'],
            'price'         => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'discount_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'discount_ends_at' => ['nullable', 'date'],
            'difficulty_level' => ['required', 'string', 'max:20', Rule::in(['beginner', 'intermediate', 'advanced', 'all_levels'])],
            'status'        => ['required', 'string', 'max:20', Rule::in(['draft', 'published', 'archived'])],
            'courses'       => ['nullable', 'array'],
            'courses.*.course_id' => ['required', 'uuid', Rule::exists('courses', 'id')],
            'courses.*.is_required' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'       => 'El título es obligatorio.',
            'slug.unique'          => 'Ese slug ya está en uso.',
            'slug.regex'           => 'El slug solo puede contener letras minúsculas, números y guiones.',
            'description.required' => 'La descripción es obligatoria.',
            'instructor_id.exists' => 'El instructor seleccionado no existe.',
            'category_id.exists'   => 'La categoría seleccionada no existe.',
            'courses.*.course_id.exists' => 'Uno de los cursos seleccionados no existe.',
        ];
    }
}
