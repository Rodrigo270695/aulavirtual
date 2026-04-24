<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InstructorCredentialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach (['obtained_date', 'expiry_date', 'credential_url'] as $key) {
            if ($this->has($key) && $this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'instructor_id' => ['required', 'uuid', Rule::exists('instructors', 'id')],
            'credential_type' => ['required', 'string', 'max:50', Rule::in(['degree', 'certification', 'award', 'publication'])],
            'title' => ['required', 'string', 'max:255'],
            'institution' => ['required', 'string', 'max:200'],
            'obtained_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date', 'after_or_equal:obtained_date'],
            'credential_url' => ['nullable', 'url', 'max:500'],
            'document_file' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
            'is_verified' => ['sometimes', 'boolean'],
        ];
    }

}
