<?php

namespace App\Http\Requests\Admin;

use App\Models\Instructor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InstructorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach ([
            'specialization_area',
            'teaching_bio',
            'intro_video_url',
            'approval_notes',
            'payout_method',
            'payout_details_enc',
        ] as $key) {
            if ($this->has($key) && $this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }
    }

    public function rules(): array
    {
        /** @var Instructor|null $instructor */
        $instructor = $this->route('instructor');

        return [
            'user_id' => [
                'required',
                'uuid',
                Rule::exists('users', 'id'),
                Rule::unique('instructors', 'user_id')->ignore($instructor?->id),
            ],
            'professional_title' => ['required', 'string', 'max:150'],
            'specialization_area' => ['nullable', 'string', 'max:200'],
            'teaching_bio' => ['nullable', 'string'],
            'intro_video_url' => ['nullable', 'url', 'max:500'],
            'status' => ['required', 'string', 'max:20', Rule::in(['pending', 'active', 'suspended', 'rejected'])],
            'approval_notes' => ['nullable', 'string'],
            'revenue_share_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payout_method' => ['nullable', 'string', 'max:30', Rule::in(['bank_transfer', 'yape', 'plim', 'paypal', 'stripe_connect'])],
            'payout_details_enc' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => 'Selecciona un usuario para el instructor.',
            'user_id.unique' => 'Ese usuario ya tiene un perfil de instructor.',
            'professional_title.required' => 'El título profesional es obligatorio.',
            'status.in' => 'El estado seleccionado no es válido.',
            'revenue_share_pct.max' => 'El porcentaje no puede superar 100%.',
            'intro_video_url.url' => 'La URL del video de presentación no es válida.',
            'payout_method.in' => 'El método de pago no es válido.',
        ];
    }
}
