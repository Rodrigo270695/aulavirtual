<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

trait RedirectsAfterAuth
{
    protected function redirectAfterAuthentication(Request $request): Response
    {
        /** @var User|null $user */
        $user = $request->user();
        $fallback = ($user instanceof User && $user->isStudentOnly())
            ? route('home')
            : route('dashboard');

        if ($user instanceof User && $user->isStudentOnly()) {
            $this->forgetBlockedIntendedUrls($request);
        }

        return redirect()->intended($fallback);
    }

    private function forgetBlockedIntendedUrls(Request $request): void
    {
        $u = $request->session()->get('url.intended');
        if (! is_string($u)) {
            return;
        }
        $path = parse_url($u, PHP_URL_PATH) ?: '';
        if (str_starts_with($path, '/admin') || $path === '/dashboard') {
            $request->session()->forget('url.intended');
        }
    }
}
