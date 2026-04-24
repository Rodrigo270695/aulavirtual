<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Request unificado para crear y editar usuarios desde el panel admin.
 *
 * Cuando la ruta incluye {user} (edición), las reglas unique de email y username
 * ignoran ese registro; la contraseña es opcional al actualizar.
 */
class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Los permisos granulares se comprueban en el controlador.
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('username') && $this->input('username') === '') {
            $this->merge(['username' => null]);
        }

        if ($this->input('document_type') === 'none' || $this->input('document_type') === '') {
            $this->merge(['document_type' => null]);
        }

        if ($this->route('user') && $this->input('password') === '') {
            $this->merge([
                'password' => null,
                'password_confirmation' => null,
            ]);
        }

        foreach (['document_number', 'phone_country_code', 'phone_number', 'country_code'] as $key) {
            if ($this->has($key) && $this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }

        // users.timezone tiene DEFAULT en BD pero no es nullable; evitar NULL explícito en INSERT/UPDATE.
        if (! $this->filled('timezone')) {
            $this->merge(['timezone' => 'America/Lima']);
        }
    }

    public function rules(): array
    {
        /** @var User|null $user */
        $user = $this->route('user');
        $userId = $user?->getKey();

        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'username' => [
                'nullable',
                'string',
                'max:50',
                'regex:/^[a-zA-Z0-9._-]+$/',
                Rule::unique('users', 'username')->ignore($userId),
            ],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => $userId
                ? ['nullable', 'string', 'min:8', 'confirmed']
                : ['required', 'string', 'min:8', 'confirmed'],

            'document_type' => [
                'nullable',
                'string',
                'max:20',
                Rule::in(['dni', 'ce', 'passport', 'cedula', 'ruc']),
            ],
            'document_number' => ['nullable', 'string', 'max:20'],
            'phone_country_code' => ['nullable', 'string', 'max:5'],
            'phone_number' => ['nullable', 'string', 'max:15'],
            'country_code' => ['nullable', 'string', 'size:2', 'regex:/^[A-Za-z]{2}$/'],
            'timezone' => ['nullable', 'string', 'max:60'],
            'is_active' => ['sometimes', 'boolean'],

            'roles' => ['nullable', 'array'],
            'roles.*' => ['integer', Rule::exists('roles', 'id')],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var User|null $user */
            $user = $this->route('user');
            if (! $user instanceof User || ! $user->isImmutableDemoAccount()) {
                return;
            }

            $incoming = strtolower(trim((string) $this->input('email', '')));
            $current = strtolower(trim((string) $user->email));

            if ($incoming !== $current) {
                $validator->errors()->add(
                    'email',
                    'Este usuario está protegido: el correo de acceso no puede modificarse.',
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'El nombre es obligatorio.',
            'first_name.max' => 'El nombre no puede superar los 100 caracteres.',
            'last_name.required' => 'El apellido es obligatorio.',
            'last_name.max' => 'El apellido no puede superar los 100 caracteres.',
            'username.unique' => 'Ese nombre de usuario ya está en uso.',
            'username.regex' => 'El usuario solo puede contener letras, números, punto, guion y guion bajo.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'Introduce un correo electrónico válido.',
            'email.unique' => 'Ya existe una cuenta con ese correo.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'La confirmación de contraseña no coincide.',
            'document_type.in' => 'El tipo de documento no es válido.',
            'roles.*.exists' => 'Uno o más roles seleccionados no existen.',
        ];
    }
}
