<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    /**
     * Reglas de validación para el perfil de usuario (nombre y correo).
     *
     * @return array<string, array<int, mixed>>
     */
    protected function profileRules(string|int|null $userId = null): array
    {
        return [
            'first_name' => $this->nameRules(),
            'last_name'  => $this->nameRules(),
            'email'      => $this->emailRules($userId),
        ];
    }

    /**
     * Documento, teléfono, país y zona horaria (misma semántica que en el panel admin).
     *
     * @return array<string, array<int, mixed>>
     */
    protected function identityContactRules(): array
    {
        return [
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
        ];
    }

    /**
     * Reglas para campos de nombre (primer nombre / apellidos).
     *
     * @return array<int, mixed>
     */
    protected function nameRules(): array
    {
        return ['required', 'string', 'max:100'];
    }

    /**
     * Reglas para el email con unicidad opcional por usuario.
     *
     * @return array<int, mixed>
     */
    protected function emailRules(string|int|null $userId = null): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }
}
