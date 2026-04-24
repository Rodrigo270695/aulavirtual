<?php

namespace App\Http\Responses\Fortify;

use App\Support\RedirectsAfterAuth;
use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Symfony\Component\HttpFoundation\Response;

class RegisterResponse implements RegisterResponseContract
{
    use RedirectsAfterAuth;

    public function toResponse($request): Response
    {
        if ($request->wantsJson()) {
            return new JsonResponse('', 201);
        }

        return $this->redirectAfterAuthentication($request);
    }
}
