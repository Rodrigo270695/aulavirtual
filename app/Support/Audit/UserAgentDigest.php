<?php

namespace App\Support\Audit;

/**
 * Resumen ligero del User-Agent para auditoría (sin dependencias externas).
 */
final class UserAgentDigest
{
    /**
     * @return array{browser: string|null, os: string|null, device_type: string|null}
     */
    public static function summarize(?string $userAgent): array
    {
        if ($userAgent === null || $userAgent === '') {
            return ['browser' => null, 'os' => null, 'device_type' => null];
        }

        $ua = strtolower($userAgent);

        $browser = null;
        if (str_contains($ua, 'edg/') || str_contains($ua, 'edgios')) {
            $browser = 'Edge';
        } elseif (str_contains($ua, 'opr/') || str_contains($ua, 'opera')) {
            $browser = 'Opera';
        } elseif (str_contains($ua, 'chrome') || str_contains($ua, 'crios')) {
            $browser = 'Chrome';
        } elseif (str_contains($ua, 'firefox') || str_contains($ua, 'fxios')) {
            $browser = 'Firefox';
        } elseif (str_contains($ua, 'safari') && ! str_contains($ua, 'chrome')) {
            $browser = 'Safari';
        } elseif (str_contains($ua, 'msie') || str_contains($ua, 'trident/')) {
            $browser = 'IE';
        }

        $os = null;
        if (str_contains($ua, 'windows')) {
            $os = 'Windows';
        } elseif (str_contains($ua, 'android')) {
            $os = 'Android';
        } elseif (str_contains($ua, 'iphone') || str_contains($ua, 'ipad') || str_contains($ua, 'ios')) {
            $os = 'iOS';
        } elseif (str_contains($ua, 'mac os x') || str_contains($ua, 'macintosh')) {
            $os = 'macOS';
        } elseif (str_contains($ua, 'linux')) {
            $os = 'Linux';
        }

        $device = null;
        if (str_contains($ua, 'mobile') || str_contains($ua, 'android') || str_contains($ua, 'iphone')) {
            $device = 'mobile';
        } elseif (str_contains($ua, 'tablet') || str_contains($ua, 'ipad')) {
            $device = 'tablet';
        } elseif ($browser !== null || $os !== null) {
            $device = 'desktop';
        }

        return [
            'browser' => $browser,
            'os' => $os,
            'device_type' => $device,
        ];
    }
}
