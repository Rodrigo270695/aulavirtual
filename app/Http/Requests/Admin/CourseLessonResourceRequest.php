<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CourseLessonResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('description') && $this->input('description') === '') {
            $this->merge(['description' => null]);
        }
    }

    public function rules(): array
    {
        return [
            'resource_type' => ['required', 'string', 'max:30', Rule::in(['link', 'github', 'download', 'software', 'dataset'])],
            'title' => ['required', 'string', 'max:255'],
            'url' => ['required', 'string', 'max:1000', 'url'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:32767'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'El título del recurso es obligatorio.',
            'url.required' => 'La URL del recurso es obligatoria.',
            'url.url' => 'Introduce una URL válida (https://…).',
        ];
    }
}
