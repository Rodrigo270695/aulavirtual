<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    protected function prepareForValidation(): void
    {
        if ($this->input('document_type') === 'none' || $this->input('document_type') === '') {
            $this->merge(['document_type' => null]);
        }

        foreach (['document_number', 'phone_country_code', 'phone_number', 'country_code'] as $key) {
            if ($this->has($key) && $this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }

        if ($this->filled('country_code')) {
            $this->merge(['country_code' => strtoupper((string) $this->input('country_code'))]);
        }

        if (! $this->filled('timezone')) {
            $this->merge(['timezone' => 'America/Lima']);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return array_merge(
            $this->profileRules($this->user()->getKey()),
            $this->identityContactRules(),
        );
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $user = $this->user();
            if ($user === null || ! $user->isImmutableDemoAccount()) {
                return;
            }

            $incoming = strtolower(trim((string) $this->input('email', '')));
            $current = strtolower(trim((string) $user->email));

            if ($incoming !== $current) {
                $validator->errors()->add(
                    'email',
                    'Esta cuenta está protegida: el correo de acceso no puede modificarse.',
                );
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'first_name.required' => 'El nombre es obligatorio.',
            'first_name.max' => 'El nombre no puede superar los 100 caracteres.',
            'last_name.required' => 'El apellido es obligatorio.',
            'last_name.max' => 'El apellido no puede superar los 100 caracteres.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'Introduce un correo electrónico válido.',
            'email.unique' => 'Ya existe una cuenta con ese correo.',
            'document_type.in' => 'El tipo de documento no es válido.',
            'country_code.size' => 'El país debe ser un código ISO de dos letras.',
            'country_code.regex' => 'El país debe ser un código ISO de dos letras.',
        ];
    }
}
