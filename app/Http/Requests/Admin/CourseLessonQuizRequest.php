<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CourseLessonQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('time_limit_minutes') && $this->input('time_limit_minutes') === '') {
            $this->merge(['time_limit_minutes' => null]);
        }
        if ($this->has('description') && $this->input('description') === '') {
            $this->merge(['description' => null]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'quiz_type' => ['required', 'in:formative,summative'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:1', 'max:10080'],
            'max_attempts' => ['required', 'integer', 'min:-1', 'max:32767'],
            'passing_score' => ['required', 'numeric', 'min:60', 'max:100'],
            'shuffle_questions' => ['sometimes', 'boolean'],
            'shuffle_options' => ['sometimes', 'boolean'],
            'show_answers_after' => ['required', 'in:never,submission,passed'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
