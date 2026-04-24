<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class PackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_active' => $this->boolean('is_active'),
        ]);

        if ($this->filled('title') && ! $this->filled('slug')) {
            $this->merge(['slug' => Str::slug($this->string('title'))]);
        }

        foreach (['description', 'cover_image', 'valid_from', 'valid_until'] as $key) {
            if ($this->has($key) && $this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }

        $courses = $this->input('courses');
        if (! is_array($courses)) {
            $this->merge(['courses' => []]);

            return;
        }

        $normalized = collect($courses)
            ->filter(fn ($row) => is_array($row) && ! empty($row['course_id']))
            ->map(fn (array $row) => [
                'course_id' => (string) $row['course_id'],
            ])
            ->values()
            ->all();

        $this->merge(['courses' => $normalized]);
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $courses = $this->input('courses', []);
            if (is_array($courses)) {
                $ids = collect($courses)->pluck('course_id')->filter()->all();
                if (count($ids) !== count(array_unique($ids))) {
                    $v->errors()->add('courses', 'No puedes incluir el mismo curso más de una vez en el paquete.');
                }
            }

            $from = $this->input('valid_from');
            $until = $this->input('valid_until');
            if ($from && $until && strtotime((string) $until) < strtotime((string) $from)) {
                $v->errors()->add('valid_until', 'La fecha de fin debe ser igual o posterior al inicio.');
            }
        });
    }

    public function rules(): array
    {
        /** @var \App\Models\Package|null $package */
        $package = $this->route('package');
        $packageId = $package?->getKey();

        return [
            'title'         => ['required', 'string', 'max:255'],
            'slug'          => [
                'required',
                'string',
                'max:300',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('packages', 'slug')->ignore($packageId),
            ],
            'description'   => ['nullable', 'string'],
            'cover_image'   => ['nullable', 'string', 'max:500'],
            'package_price' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'is_active'     => ['boolean'],
            'valid_from'    => ['nullable', 'date'],
            'valid_until'   => ['nullable', 'date'],
            'courses'       => ['nullable', 'array'],
            'courses.*.course_id' => ['required', 'uuid', Rule::exists('courses', 'id')],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'El título es obligatorio.',
            'slug.unique'    => 'Ese slug ya está en uso.',
            'slug.regex'     => 'El slug solo puede contener letras minúsculas, números y guiones.',
            'package_price.required' => 'El precio del paquete es obligatorio.',
            'courses.*.course_id.exists' => 'Uno de los cursos seleccionados no existe.',
        ];
    }
}
