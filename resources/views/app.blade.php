<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Forzar siempre modo claro independiente del sistema operativo --}}
        <style>
            html {
                background-color: oklch(0.99 0 0);
                color-scheme: light;
                height: 100%;
            }
            body {
                height: 100%;
                margin: 0;
            }
            /* Permitir scroll vertical de páginas públicas/largas.
               Solo ocultamos desbordes horizontales accidentales. */
            #app {
                min-height: 100%;
                overflow-x: hidden;
            }
        </style>

        @php
            $platformFavicon = \App\Models\PlatformSetting::publicMediaUrl(
                \App\Models\PlatformSetting::current()->favicon_path,
                'logo/icono.png',
            );
            $platformFaviconType = \App\Models\PlatformSetting::faviconLinkType(
                \App\Models\PlatformSetting::current()->favicon_path,
            );
        @endphp
        <link rel="icon" href="{{ $platformFavicon }}" type="{{ $platformFaviconType }}">
        <link rel="apple-touch-icon" href="{{ $platformFavicon }}">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
