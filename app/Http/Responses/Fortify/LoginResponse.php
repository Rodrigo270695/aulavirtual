<?php

namespace App\Http\Responses\Fortify;

use App\Support\RedirectsAfterAuth;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    use RedirectsAfterAuth;

    public function toResponse($request): Response
    {
        if ($request->wantsJson()) {
            return response()->json(['two_factor' => false]);
        }

        return $this->redirectAfterAuthentication($request);
    }
}
