<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Configuración general del sistema (contacto, enlaces legales y redes).
 */
class GeneralSettingController extends Controller
{
    public function edit(): Response
    {
        $this->authorize('general.view');

        $row = PlatformSetting::current();
        $user = request()->user();

        return Inertia::render('admin/general-settings/index', [
            'settings' => [
                'contact_email' => $row->contact_email,
                'support_url' => $row->support_url,
                'terms_url' => $row->terms_url,
                'privacy_url' => $row->privacy_url,
                'social_facebook' => $row->social_facebook,
                'social_instagram' => $row->social_instagram,
                'social_linkedin' => $row->social_linkedin,
                'social_youtube' => $row->social_youtube,
            ],
            'can' => [
                'edit' => $user?->can('general.edit') ?? false,
            ],
        ]);
    }

    public function update(): RedirectResponse
    {
        $this->authorize('general.edit');

        $validated = request()->validate([
            'contact_email' => ['nullable', 'string', 'email', 'max:255'],
            'support_url' => ['nullable', 'string', 'max:500'],
            'terms_url' => ['nullable', 'string', 'max:500'],
            'privacy_url' => ['nullable', 'string', 'max:500'],
            'social_facebook' => ['nullable', 'string', 'max:500'],
            'social_instagram' => ['nullable', 'string', 'max:500'],
            'social_linkedin' => ['nullable', 'string', 'max:500'],
            'social_youtube' => ['nullable', 'string', 'max:500'],
        ]);

        $payload = collect($validated)
            ->map(fn ($value) => is_string($value) && trim($value) === '' ? null : $value)
            ->all();

        PlatformSetting::current()->update($payload);

        return back()->with('success', 'Configuración general actualizada.');
    }
}
