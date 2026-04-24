<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CourseLessonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_free_preview' => $this->boolean('is_free_preview'),
            'is_published' => $this->boolean('is_published'),
            'has_homework' => $this->boolean('has_homework'),
        ]);

        if ($this->has('description') && $this->input('description') === '') {
            $this->merge(['description' => null]);
        }

        if ($this->has('content_text') && $this->input('content_text') === '') {
            $this->merge(['content_text' => null]);
        }

        if ($this->has('duration_seconds')) {
            $v = $this->input('duration_seconds');
            $this->merge(['duration_seconds' => ($v === '' || $v === null) ? 0 : (int) $v]);
        }
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'lesson_type' => ['required', 'string', Rule::in(['video', 'document', 'article', 'quiz', 'assignment'])],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:32767'],
            'duration_seconds' => ['nullable', 'integer', 'min:0', 'max:2147483647'],
            'is_free_preview' => ['boolean'],
            'is_published' => ['boolean'],
            'has_homework' => ['boolean'],
            'content_text' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'El título de la lección es obligatorio.',
        ];
    }
}
