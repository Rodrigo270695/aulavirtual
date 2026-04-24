<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Crear / editar plantillas de certificado desde el panel admin.
 */
class CertificateTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach (['course_id', 'specialization_id', 'signatory_name', 'signatory_title'] as $key) {
            if ($this->has($key) && $this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }
    }

    public function rules(): array
    {
        $imageFile = ['nullable', 'file', 'image', 'mimes:jpeg,jpg,png,webp,gif', 'max:5120'];

        return [
            'name' => ['required', 'string', 'max:255'],
            'course_id' => ['nullable', 'uuid', 'exists:courses,id'],
            'specialization_id' => ['nullable', 'uuid', 'exists:specializations,id'],
            'template_html' => ['required', 'string'],
            'background_image_file' => $imageFile,
            'signature_image_file' => $imageFile,
            'institution_logo_file' => $imageFile,
            'remove_background' => ['sometimes', 'boolean'],
            'remove_signature' => ['sometimes', 'boolean'],
            'remove_logo' => ['sometimes', 'boolean'],
            'signatory_name' => ['nullable', 'string', 'max:150'],
            'signatory_title' => ['nullable', 'string', 'max:150'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if ($this->filled('course_id') && $this->filled('specialization_id')) {
                $v->errors()->add('course_id', 'Selecciona solo un curso o una especialización, no ambos.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre de la plantilla es obligatorio.',
            'template_html.required' => 'El contenido HTML de la plantilla es obligatorio.',
            'course_id.exists' => 'El curso seleccionado no existe.',
            'specialization_id.exists' => 'La especialización seleccionada no existe.',
            'background_image_file.image' => 'El fondo debe ser una imagen válida.',
            'signature_image_file.image' => 'La firma debe ser una imagen válida.',
            'institution_logo_file.image' => 'El logo debe ser una imagen válida.',
            'background_image_file.max' => 'El fondo no puede superar 5 MB.',
            'signature_image_file.max' => 'La firma no puede superar 5 MB.',
            'institution_logo_file.max' => 'El logo no puede superar 5 MB.',
        ];
    }
}
