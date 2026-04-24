<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\LessonVideo;

/**
 * Construye URLs reproducibles en el aula del alumno (archivo local vs embed).
 * YouTube/Vimeo no funcionan en <video src="...">; deben ir en iframe con URL de embed.
 */
final class LessonVideoPlaybackUrl
{
    public static function fileUrl(?LessonVideo $video): ?string
    {
        if ($video === null || $video->video_source !== 'upload') {
            return null;
        }

        $path = $video->storage_path;
        if (! is_string($path) || $path === '') {
            return null;
        }

        return asset('storage/'.$path);
    }

    /**
     * Enlace para abrir el vídeo en la web del proveedor (YouTube/Vimeo) cuando el embed está bloqueado o falla.
     */
    public static function providerPageUrl(?LessonVideo $video): ?string
    {
        if ($video === null || $video->video_source === 'upload') {
            return null;
        }

        $rawUrl = self::trim($video->external_url);
        if ($rawUrl !== null) {
            $abs = self::absoluteUrl($rawUrl);
            if ($abs !== null) {
                return $abs;
            }
        }

        return match ((string) $video->video_source) {
            'youtube' => self::youtubeWatchPageUrl($video),
            'vimeo' => self::vimeoWatchPageUrl($video),
            'external' => self::absoluteUrl(self::trim($video->external_embed_url)),
            default => null,
        };
    }

    public static function iframeSrc(?LessonVideo $video): ?string
    {
        if ($video === null || $video->video_source === 'upload') {
            return null;
        }

        $source = (string) $video->video_source;
        $embed = self::trim($video->external_embed_url);
        $pageUrl = self::trim($video->external_url);
        $providerId = self::trim($video->external_provider_video_id);

        if ($embed !== null) {
            $fromEmbed = self::normalizeEmbedCandidate($embed, $source);
            if ($fromEmbed !== null) {
                return $fromEmbed;
            }
        }

        return match ($source) {
            'youtube' => self::youtubeEmbed($pageUrl, $providerId),
            'vimeo' => self::vimeoEmbed($pageUrl, $providerId),
            'external' => self::externalGeneric($pageUrl, $embed),
            default => null,
        };
    }

    private static function normalizeEmbedCandidate(string $value, string $declaredSource): ?string
    {
        $v = trim($value);
        if ($v === '') {
            return null;
        }

        if ($declaredSource === 'youtube' || str_contains($v, 'youtube.com') || str_contains($v, 'youtu.be')) {
            $id = self::parseYoutubeId($v);
            if ($id !== null) {
                return 'https://www.youtube.com/embed/'.$id;
            }
        }

        if ($declaredSource === 'vimeo' || str_contains($v, 'vimeo.com')) {
            $id = self::parseVimeoId($v);
            if ($id !== null) {
                return 'https://player.vimeo.com/video/'.$id;
            }
        }

        return self::absoluteUrl($v);
    }

    private static function youtubeEmbed(?string $pageUrl, ?string $providerId): ?string
    {
        $id = self::trim($providerId);
        if ($id === null && $pageUrl !== null) {
            $id = self::parseYoutubeId($pageUrl);
        }
        if ($id === null || $id === '') {
            return null;
        }

        // youtube.com/embed suele respetar igual la opción "permitir incrustación"; nocookie es preferible por cookies.
        return 'https://www.youtube.com/embed/'.$id;
    }

    private static function vimeoEmbed(?string $pageUrl, ?string $providerId): ?string
    {
        $id = self::trim($providerId);
        if ($id === null && $pageUrl !== null) {
            $id = self::parseVimeoId($pageUrl);
        }
        if ($id === null || $id === '') {
            return null;
        }

        return 'https://player.vimeo.com/video/'.$id;
    }

    private static function externalGeneric(?string $pageUrl, ?string $embed): ?string
    {
        if ($embed !== null) {
            $u = self::absoluteUrl($embed);
            if ($u !== null) {
                return $u;
            }
        }

        return self::absoluteUrl($pageUrl);
    }

    private static function youtubeWatchPageUrl(LessonVideo $video): ?string
    {
        $id = self::trim($video->external_provider_video_id)
            ?? self::parseYoutubeId((string) ($video->external_url ?? ''))
            ?? self::parseYoutubeId((string) ($video->external_embed_url ?? ''));

        if ($id === null || $id === '') {
            return null;
        }

        return 'https://www.youtube.com/watch?v='.$id;
    }

    private static function vimeoWatchPageUrl(LessonVideo $video): ?string
    {
        $id = self::trim($video->external_provider_video_id)
            ?? self::parseVimeoId((string) ($video->external_url ?? ''))
            ?? self::parseVimeoId((string) ($video->external_embed_url ?? ''));

        if ($id === null || $id === '') {
            return null;
        }

        return 'https://vimeo.com/'.$id;
    }

    private static function parseYoutubeId(string $url): ?string
    {
        $url = trim($url);
        if ($url === '') {
            return null;
        }

        if (preg_match('~(?:youtube\.com/embed/|youtube-nocookie\.com/embed/)([a-zA-Z0-9_-]{11})~', $url, $m)) {
            return $m[1];
        }

        if (preg_match('~(?:youtube\.com/watch\?v=|m\.youtube\.com/watch\?v=|youtube\.com/shorts/|youtu\.be/)([a-zA-Z0-9_-]{11})~', $url, $m)) {
            return $m[1];
        }

        if (preg_match('~^[a-zA-Z0-9_-]{11}$~', $url)) {
            return $url;
        }

        return null;
    }

    private static function parseVimeoId(string $url): ?string
    {
        $url = trim($url);
        if ($url === '') {
            return null;
        }

        if (preg_match('~player\.vimeo\.com/video/(\d+)~', $url, $m)) {
            return $m[1];
        }

        if (preg_match('~vimeo\.com/(?:channels/[^/]+/|groups/[^/]+/videos/)?(\d+)~', $url, $m)) {
            return $m[1];
        }

        if (preg_match('~^(\d+)$~', $url)) {
            return $url;
        }

        return null;
    }

    private static function absoluteUrl(?string $value): ?string
    {
        $v = self::trim($value);
        if ($v === null) {
            return null;
        }

        if (str_starts_with($v, '//')) {
            return 'https:'.$v;
        }

        if (str_starts_with($v, 'http://') || str_starts_with($v, 'https://')) {
            return $v;
        }

        return null;
    }

    private static function trim(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $t = trim($value);

        return $t === '' ? null : $t;
    }
}
