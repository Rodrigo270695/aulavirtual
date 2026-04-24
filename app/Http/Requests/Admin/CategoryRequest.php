<?php

namespace App\Http\Requests\Admin;

use App\Models\Category;
use App\Support\CategoryLucideIcons;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach (['description', 'icon'] as $key) {
            if ($this->has($key) && $this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }

        if ($this->input('parent_id') === '' || $this->input('parent_id') === '__none__') {
            $this->merge(['parent_id' => null]);
        }

        if ($this->filled('name') && ! $this->filled('slug')) {
            $this->merge(['slug' => Str::slug($this->input('name'))]);
        }

        if ($this->has('tags') && is_array($this->input('tags'))) {
            $clean = collect($this->input('tags'))
                ->map(fn ($t) => mb_strtolower(trim((string) $t)))
                ->filter(fn ($t) => $t !== '')
                ->values()
                ->all();
            $this->merge(['tags' => $clean]);
        } else {
            $this->merge(['tags' => []]);
        }
    }

    public function rules(): array
    {
        /** @var Category|null $category */
        $category = $this->route('category');
        $categoryId = $category?->getKey();

        return [
            'parent_id' => [
                'nullable',
                'uuid',
                Rule::exists('categories', 'id'),
                function (string $attribute, mixed $value, \Closure $fail) use ($categoryId): void {
                    if ($categoryId !== null && $value === $categoryId) {
                        $fail('Una categoría no puede ser padre de sí misma.');
                    }
                },
            ],
            'name' => ['required', 'string', 'max:100'],
            'slug' => [
                'required',
                'string',
                'max:120',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('categories', 'slug')->ignore($categoryId),
            ],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', Rule::in(CategoryLucideIcons::keys())],
            'cover_image_file' => ['nullable', 'file', 'image', 'mimes:jpeg,jpg,png,webp,gif', 'max:5120'],
            'remove_cover' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'tags' => ['sometimes', 'array'],
            'tags.*' => ['string', 'max:80'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es obligatorio.',
            'slug.required' => 'El slug es obligatorio.',
            'slug.unique' => 'Ese slug ya está en uso.',
            'slug.regex' => 'El slug solo puede contener letras minúsculas, números y guiones.',
            'parent_id.exists' => 'La categoría padre no existe.',
            'parent_id.not_in' => 'Una categoría no puede ser padre de sí misma.',
            'icon.in' => 'El ícono debe elegirse de la lista permitida.',
        ];
    }
}
