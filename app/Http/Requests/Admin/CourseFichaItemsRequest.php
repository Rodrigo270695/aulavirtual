<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CourseFichaItemsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['present', 'array', 'max:100'],
            'items.*.description' => ['required', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.array' => 'El formato de la lista no es válido.',
            'items.max' => 'Como máximo 100 ítems por sección.',
            'items.*.description.required' => 'Cada ítem debe tener texto.',
            'items.*.description.max' => 'Cada ítem admite como máximo 500 caracteres.',
        ];
    }
}
