<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class EmitCertificateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach (['enrollment_id', 'template_id'] as $key) {
            if ($this->has($key) && $this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'enrollment_id' => ['required', 'uuid', 'exists:enrollments,id'],
            'template_id' => ['nullable', 'uuid', 'exists:certificate_templates,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'enrollment_id.required' => 'Selecciona una matrícula para emitir el certificado.',
            'enrollment_id.exists' => 'La matrícula seleccionada no existe.',
            'template_id.exists' => 'La plantilla seleccionada no existe.',
        ];
    }
}

