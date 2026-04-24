<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CourseLessonQuizQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'question_text' => ['required', 'string'],
            'question_type' => ['required', 'in:single_choice,multiple_choice,true_false,short_answer,essay'],
            'explanation' => ['nullable', 'string'],
            'image_path' => ['nullable', 'string', 'max:500'],
            'points' => ['required', 'numeric', 'min:0', 'max:999'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:32767'],
            'options' => ['nullable', 'array'],
            'options.*.option_text' => ['required_with:options', 'string'],
            'options.*.is_correct' => ['required_with:options', 'boolean'],
            'options.*.explanation' => ['nullable', 'string'],
            'options.*.sort_order' => ['nullable', 'integer', 'min:0', 'max:32767'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $type = $this->input('question_type');
            if (! in_array($type, ['single_choice', 'multiple_choice', 'true_false'], true)) {
                return;
            }

            $options = $this->input('options', []);
            if (count($options) < 1) {
                $v->errors()->add('options', 'Este tipo de pregunta requiere al menos una opción.');

                return;
            }

            $correct = 0;
            foreach ($options as $opt) {
                if (! empty($opt['is_correct'])) {
                    $correct++;
                }
            }

            if ($correct < 1) {
                $v->errors()->add('options', 'Marca al menos una opción como correcta.');
            }

            if ($type === 'true_false' && count($options) !== 2) {
                $v->errors()->add('options', 'Verdadero/falso debe tener exactamente dos opciones.');
            }

            if ($type === 'single_choice' && $correct > 1) {
                $v->errors()->add('options', 'Solo una opción puede ser correcta en respuesta única.');
            }
        });
    }
}
