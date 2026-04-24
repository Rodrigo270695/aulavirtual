<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class PlatformSetting extends Model
{
    protected $fillable = [
        'app_name',
        'app_tagline',
        'logo_path',
        'icon_path',
        'favicon_path',
        'color_primary',
        'color_secondary',
        'color_accent',
        'login_bg_from',
        'login_bg_to',
        'login_tagline',
        'contact_email',
        'support_url',
        'terms_url',
        'privacy_url',
        'social_facebook',
        'social_instagram',
        'social_linkedin',
        'social_youtube',
    ];

    /**
     * Obtiene la fila única de configuración.
     * Si no existe la crea con los valores por defecto.
     */
    public static function current(): static
    {
        return static::firstOrCreate(['id' => 1], [
            'app_name'        => config('app.name', 'Aula Virtual'),
            'color_primary'   => '#1a56db',
            'color_secondary' => '#1e3a8a',
            'color_accent'    => '#35a0ff',
            'login_bg_from'   => '#0d1b6e',
            'login_bg_to'     => '#1a56db',
        ]);
    }

    /**
     * URL pública para un path guardado en disco `public` (`storage/...`) o en `public/` (`logo/...`).
     */
    public static function publicMediaUrl(?string $path, string $fallbackRelativeToPublic): string
    {
        if (! $path) {
            return asset($fallbackRelativeToPublic);
        }

        if (str_starts_with($path, 'storage/')) {
            $relative = substr($path, strlen('storage/'));

            return Storage::disk('public')->url($relative);
        }

        return asset($path);
    }

    /**
     * MIME sugerido para `<link rel="icon">` según extensión del path guardado.
     */
    public static function faviconLinkType(?string $path): string
    {
        if (! $path) {
            return 'image/png';
        }

        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return match ($ext) {
            'ico' => 'image/x-icon',
            'svg' => 'image/svg+xml',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            default => 'image/png',
        };
    }

    /**
     * Devuelve un array serializable para Inertia / frontend.
     */
    public static function forFrontend(): array
    {
        $s = static::current();

        return [
            'app_name'        => $s->app_name,
            'app_tagline'     => $s->app_tagline,
            'logo_url'        => static::publicMediaUrl($s->logo_path, 'logo/logo.png'),
            'icon_url'        => static::publicMediaUrl($s->icon_path, 'logo/icono.png'),
            'favicon_url'     => static::publicMediaUrl($s->favicon_path, 'logo/icono.png'),
            'color_primary'   => $s->color_primary,
            'color_secondary' => $s->color_secondary,
            'color_accent'    => $s->color_accent,
            'login_bg_from'   => $s->login_bg_from,
            'login_bg_to'     => $s->login_bg_to,
            'login_tagline'   => $s->login_tagline,
            'contact_email'   => $s->contact_email,
            'support_url'     => $s->support_url,
            'terms_url'       => $s->terms_url,
            'privacy_url'     => $s->privacy_url,
            'social_facebook' => $s->social_facebook,
            'social_instagram'=> $s->social_instagram,
            'social_linkedin' => $s->social_linkedin,
            'social_youtube'  => $s->social_youtube,
        ];
    }
}
