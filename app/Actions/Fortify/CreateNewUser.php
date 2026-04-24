<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Spatie\Permission\Models\Role;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Valida y crea un nuevo usuario registrado.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        $user = User::create([
            'first_name'        => $input['first_name'],
            'last_name'         => $input['last_name'],
            'email'             => $input['email'],
            'password'          => $input['password'],
            'email_verified_at' => now(),
            'is_active'         => true,
            'country_code'      => 'PE',
            'timezone'          => 'America/Lima',
        ]);

        // Asignar rol por defecto — si el rol no existe aún, lo crea.
        $student = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        $user->assignRole($student);

        return $user;
    }
}
