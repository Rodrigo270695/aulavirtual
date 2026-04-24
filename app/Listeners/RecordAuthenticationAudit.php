<?php

namespace App\Listeners;

use App\Models\User;
use App\Services\Audit\AuthAuditRecorder;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;

class RecordAuthenticationAudit
{
    public function handleLogin(Login $event): void
    {
        if ($event->guard !== 'web') {
            return;
        }

        $user = $event->user;
        if (! $user instanceof User) {
            return;
        }

        AuthAuditRecorder::recordLogin(request(), $user);
    }

    public function handleLogout(Logout $event): void
    {
        if ($event->guard !== 'web') {
            return;
        }

        $user = $event->user;
        if (! $user instanceof User) {
            return;
        }

        AuthAuditRecorder::recordLogout(request(), $user);
    }

    public function handleFailed(Failed $event): void
    {
        if ($event->guard !== 'web') {
            return;
        }

        $user = $event->user instanceof User ? $event->user : null;
        /** @var array<string, mixed> $credentials */
        $credentials = $event->credentials;

        AuthAuditRecorder::recordFailedLogin(request(), $user, $credentials);
    }
}
