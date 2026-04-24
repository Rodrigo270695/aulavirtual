<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CourseModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_free_preview' => $this->boolean('is_free_preview'),
        ]);

        if ($this->has('description') && $this->input('description') === '') {
            $this->merge(['description' => null]);
        }

        foreach (['duration_minutes', 'total_lessons'] as $key) {
            if ($this->has($key)) {
                $v = $this->input($key);
                $this->merge([$key => ($v === '' || $v === null) ? 0 : (int) $v]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:32767'],
            'is_free_preview' => ['boolean'],
            'duration_minutes' => ['nullable', 'integer', 'min:0', 'max:2147483647'],
            'total_lessons' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'El título del módulo es obligatorio.',
        ];
    }
}
