<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PlatformSettingUpdateRequest;
use App\Models\PlatformSetting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Configuración global de la plataforma (una sola fila).
 */
class PlatformSettingController extends Controller
{
    public function edit(): Response
    {
        $this->authorize('plataforma.view');

        $row = PlatformSetting::current();
        $fe = PlatformSetting::forFrontend();

        return Inertia::render('admin/platform-settings/index', [
            'settings' => [
                'app_name'         => $row->app_name,
                'app_tagline'      => $row->app_tagline,
                'color_primary'    => $row->color_primary,
                'color_secondary'  => $row->color_secondary,
                'color_accent'     => $row->color_accent,
                'login_bg_from'    => $row->login_bg_from,
                'login_bg_to'      => $row->login_bg_to,
                'login_tagline'    => $row->login_tagline,
                'contact_email'    => $row->contact_email,
                'support_url'      => $row->support_url,
                'terms_url'        => $row->terms_url,
                'privacy_url'      => $row->privacy_url,
                'social_facebook'  => $row->social_facebook,
                'social_instagram' => $row->social_instagram,
                'social_linkedin'  => $row->social_linkedin,
                'social_youtube'   => $row->social_youtube,
            ],
            'media' => [
                'logo_url'    => $fe['logo_url'],
                'icon_url'    => $fe['icon_url'],
                'favicon_url' => $fe['favicon_url'],
            ],
            'defaults' => [
                'color_primary'   => '#1a56db',
                'color_secondary' => '#1e3a8a',
                'color_accent'    => '#35a0ff',
                'login_bg_from'   => '#0d1b6e',
                'login_bg_to'     => '#1a56db',
            ],
            'can' => [
                'edit' => auth()->user()->can('plataforma.edit'),
            ],
        ]);
    }

    public function update(PlatformSettingUpdateRequest $request): RedirectResponse
    {
        $data = collect($request->validated())
            ->except(['logo', 'icon', 'favicon'])
            ->all();

        $fileMap = [
            'logo'    => 'logo_path',
            'icon'    => 'icon_path',
            'favicon' => 'favicon_path',
        ];

        foreach ($fileMap as $input => $column) {
            if ($request->hasFile($input)) {
                $stored = $request->file($input)->store('platform', 'public');
                $data[$column] = 'storage/'.$stored;
            }
        }

        PlatformSetting::current()->update($data);

        return back()->with('success', 'Configuración de plataforma actualizada.');
    }
}
