<?php

namespace App\Http\Requests\Learning;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertLessonProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'enrollment_id' => ['required', 'uuid', 'exists:enrollments,id'],
            'lesson_id' => ['required', 'uuid', 'exists:lessons,id'],
            'status' => ['nullable', 'string', Rule::in(['not_started', 'in_progress', 'completed'])],
            'video_position_sec' => ['nullable', 'integer', 'min:0', 'max:864000'],
            'watch_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'enrollment_id.required' => 'La matrícula es obligatoria.',
            'enrollment_id.exists' => 'La matrícula no existe.',
            'lesson_id.required' => 'La lección es obligatoria.',
            'lesson_id.exists' => 'La lección no existe.',
            'status.in' => 'El estado de progreso no es válido.',
            'video_position_sec.integer' => 'La posición del video debe ser un número entero.',
            'watch_pct.numeric' => 'El porcentaje visto debe ser numérico.',
            'watch_pct.min' => 'El porcentaje visto no puede ser menor que 0.',
            'watch_pct.max' => 'El porcentaje visto no puede ser mayor que 100.',
        ];
    }
}
