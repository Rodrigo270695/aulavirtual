<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Request unificado para crear y editar roles.
 *
 * Cuando la ruta incluye {role} (edición), la regla unique
 * ignora automáticamente ese registro para no rechazar
 * el mismo nombre al guardar sin cambios.
 */
class RoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Los permisos granulares se comprueban en el controlador.
        return true;
    }

    public function rules(): array
    {
        $roleId = $this->route('role')?->id;

        return [
            'name' => [
                'required',
                'string',
                'min:2',
                'max:100',
                'regex:/^[a-zA-ZÀ-ÿ0-9_\- ]+$/',
                Rule::unique('roles', 'name')->ignore($roleId),
            ],
            'permissions'   => ['nullable', 'array'],
            'permissions.*' => [
                'string',
                Rule::exists('permissions', 'name'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'      => 'El nombre del rol es obligatorio.',
            'name.min'           => 'El nombre debe tener al menos 2 caracteres.',
            'name.max'           => 'El nombre no puede superar los 100 caracteres.',
            'name.regex'         => 'El nombre solo puede contener letras, números, guiones y espacios.',
            'name.unique'        => 'Ya existe un rol con ese nombre.',
            'permissions.*.exists' => 'Uno o más permisos seleccionados no existen.',
        ];
    }
}
