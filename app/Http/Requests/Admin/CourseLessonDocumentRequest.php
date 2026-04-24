<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class CourseLessonDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_downloadable' => $this->boolean('is_downloadable', true),
        ]);
    }

    public function rules(): array
    {
        $updating = $this->route()->hasParameter('lesson_document');

        $fileRule = File::types(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'txt'])->max(25600);

        return [
            'title' => ['required', 'string', 'max:255'],
            'is_downloadable' => ['boolean'],
            'file' => array_merge(
                $updating ? ['sometimes', 'nullable'] : ['required'],
                [$fileRule],
            ),
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'El título del documento es obligatorio.',
            'file.required' => 'Debes seleccionar un archivo.',
        ];
    }
}
