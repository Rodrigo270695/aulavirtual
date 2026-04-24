<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class PlatformSettingUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('plataforma.edit') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'app_name'        => ['required', 'string', 'max:100'],
            'app_tagline'     => ['nullable', 'string', 'max:255'],
            'logo'            => ['nullable', 'file', 'max:4096', 'mimes:jpeg,jpg,png,gif,webp,svg'],
            'icon'            => ['nullable', 'file', 'max:2048', 'mimes:jpeg,jpg,png,gif,webp,svg'],
            'favicon'         => ['nullable', 'file', 'max:1024', 'mimes:jpeg,jpg,png,gif,webp,svg,ico'],
            'color_primary'   => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'color_secondary' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'color_accent'    => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'login_bg_from'   => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'login_bg_to'     => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'login_tagline'   => ['nullable', 'string', 'max:5000'],
            'contact_email'   => ['nullable', 'string', 'email', 'max:255'],
            'support_url'     => ['nullable', 'string', 'max:500'],
            'terms_url'       => ['nullable', 'string', 'max:500'],
            'privacy_url'     => ['nullable', 'string', 'max:500'],
            'social_facebook' => ['nullable', 'string', 'max:500'],
            'social_instagram'=> ['nullable', 'string', 'max:500'],
            'social_linkedin' => ['nullable', 'string', 'max:500'],
            'social_youtube'  => ['nullable', 'string', 'max:500'],
        ];
    }
}
