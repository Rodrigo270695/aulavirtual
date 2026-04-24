<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CourseLessonHomeworkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('homework_title') && trim((string) $this->input('homework_title')) === '') {
            $this->merge(['homework_title' => null]);
        }

        if ($this->has('homework_instructions') && trim((string) $this->input('homework_instructions')) === '') {
            $this->merge(['homework_instructions' => null]);
        }
    }

    public function rules(): array
    {
        return [
            'homework_title' => ['nullable', 'string', 'max:255'],
            'homework_instructions' => ['nullable', 'string'],
        ];
    }
}

