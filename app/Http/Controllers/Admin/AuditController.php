<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\LoginHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Auditoría: registros de actividad e historial de inicios de sesión (solo lectura).
 */
class AuditController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'section' => ['nullable', 'in:activity,logins'],
            'search' => ['nullable', 'string', 'max:150'],
            'status' => ['nullable', 'string', 'max:30'],
            'per_page' => ['nullable', 'integer'],
            'sort_by' => ['nullable', 'string', 'max:64'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
        ]);

        $section = $validated['section'] ?? 'activity';
        if (! in_array($section, ['activity', 'logins'], true)) {
            $section = 'activity';
        }

        $allowedPerPage = [25, 50, 75, 100];
        $perPage = (int) ($validated['per_page'] ?? 25);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 25;
        }

        $sortDir = ($validated['sort_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $search = trim((string) ($validated['search'] ?? ''));
        $status = '';

        if ($section === 'activity') {
            $sortBy = $validated['sort_by'] ?? 'created_at';
            if (! in_array($sortBy, ['created_at', 'action', 'subject_type', 'ip_address'], true)) {
                $sortBy = 'created_at';
            }

            $rows = ActivityLog::query()
                ->with(['user:id,first_name,last_name,email'])
                ->when(
                    $search !== '',
                    function ($q) use ($search): void {
                        $like = "%{$search}%";
                        $q->where(function ($inner) use ($like): void {
                            $inner->where('action', 'ilike', $like)
                                ->orWhere('subject_type', 'ilike', $like)
                                ->orWhereRaw('subject_id::text ilike ?', [$like])
                                ->orWhereRaw('ip_address::text ilike ?', [$like])
                                ->orWhere('user_agent', 'ilike', $like)
                                ->when(
                                    DB::getDriverName() === 'pgsql',
                                    fn ($q) => $q->orWhereRaw("COALESCE(extra_data::text, '') ilike ?", [$like])
                                )
                                ->orWhereHas('user', function ($uq) use ($like): void {
                                    $uq->where('email', 'ilike', $like)
                                        ->orWhere('first_name', 'ilike', $like)
                                        ->orWhere('last_name', 'ilike', $like);
                                });
                        });
                    }
                )
                ->when($sortBy === 'ip_address', fn ($q) => $q->orderByRaw("ip_address::text {$sortDir} nulls last"))
                ->when($sortBy !== 'ip_address', fn ($q) => $q->orderBy($sortBy, $sortDir))
                ->paginate($perPage)
                ->withQueryString()
                ->through(fn (ActivityLog $log) => $this->mapActivityLog($log));
        } else {
            $sortBy = $validated['sort_by'] ?? 'created_at';
            if (! in_array($sortBy, ['created_at', 'status', 'ip_address', 'browser'], true)) {
                $sortBy = 'created_at';
            }

            $status = isset($validated['status']) ? trim((string) $validated['status']) : '';
            if ($status !== '' && ! in_array($status, ['success', 'failed', 'blocked'], true)) {
                $status = '';
            }


            $rows = LoginHistory::query()
                ->with(['user:id,first_name,last_name,email'])
                ->when(
                    $status !== '',
                    fn ($q) => $q->where('status', $status)
                )
                ->when(
                    $search !== '',
                    function ($q) use ($search): void {
                        $like = "%{$search}%";
                        $q->where(function ($inner) use ($like): void {
                            $inner->where('status', 'ilike', $like)
                                ->orWhere('browser', 'ilike', $like)
                                ->orWhere('os', 'ilike', $like)
                                ->orWhere('failure_reason', 'ilike', $like)
                                ->orWhere('login_identifier', 'ilike', $like)
                                ->orWhereRaw('ip_address::text ilike ?', [$like])
                                ->orWhereHas('user', function ($uq) use ($like): void {
                                    $uq->where('email', 'ilike', $like)
                                        ->orWhere('first_name', 'ilike', $like)
                                        ->orWhere('last_name', 'ilike', $like);
                                });
                        });
                    }
                )
                ->when($sortBy === 'ip_address', fn ($q) => $q->orderByRaw("ip_address::text {$sortDir}"))
                ->when($sortBy !== 'ip_address', fn ($q) => $q->orderBy($sortBy, $sortDir))
                ->paginate($perPage)
                ->withQueryString()
                ->through(fn (LoginHistory $row) => $this->mapLoginHistory($row));
        }

        $filters = [
            'section' => $section,
            'sort_by' => $sortBy,
            'sort_dir' => $sortDir,
            'per_page' => $perPage,
        ];
        if ($search !== '') {
            $filters['search'] = $search;
        }
        if ($section === 'logins' && $status !== '') {
            $filters['status'] = $status;
        }

        return Inertia::render('admin/audit/index', [
            'rows' => $rows,
            'filters' => $filters,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapActivityLog(ActivityLog $log): array
    {
        $user = $log->user;

        $extra = $log->extra_data;
        $extraPreview = null;
        if (is_array($extra) && $extra !== []) {
            $encoded = json_encode($extra, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
            $extraPreview = is_string($encoded) ? Str::limit($encoded, 240, '…') : null;
        }

        $actorHint = null;
        if (! $user && is_array($extra) && isset($extra['login_identifier']) && is_string($extra['login_identifier'])) {
            $actorHint = $extra['login_identifier'];
        }

        $userAgent = $log->user_agent;

        return [
            'id' => $log->id,
            'action' => $log->action,
            'action_label' => $this->actionLabel($log->action),
            'actor_hint' => $actorHint,
            'subject_type' => $log->subject_type,
            'subject_short' => $this->shortClass($log->subject_type),
            'subject_id' => $log->subject_id,
            'ip_address' => $log->ip_address !== null ? (string) $log->ip_address : null,
            'user_agent_short' => $userAgent ? Str::limit((string) $userAgent, 96, '…') : null,
            'session_tail' => $log->session_id ? Str::substr((string) $log->session_id, -10) : null,
            'extra_preview' => $extraPreview,
            'user' => $user ? [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
            ] : null,
            'has_snapshot' => $log->old_values !== null || $log->new_values !== null,
            'created_at' => $log->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapLoginHistory(LoginHistory $row): array
    {
        $user = $row->user;

        return [
            'id' => $row->id,
            'ip_address' => (string) $row->ip_address,
            'status' => $row->status,
            'login_identifier' => $row->login_identifier,
            'browser' => $row->browser,
            'os' => $row->os,
            'country_code' => $row->country_code,
            'failure_reason' => $row->failure_reason,
            'user' => $user ? [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
            ] : null,
            'created_at' => $row->created_at?->toIso8601String(),
        ];
    }

    private function shortClass(?string $fqcn): ?string
    {
        if ($fqcn === null || $fqcn === '') {
            return null;
        }

        $parts = explode('\\', $fqcn);
        $last = end($parts);

        return $last !== false ? $last : $fqcn;
    }

    private function actionLabel(string $action): string
    {
        return match ($action) {
            'auth.login' => 'Inicio de sesión',
            'auth.logout' => 'Cierre de sesión',
            'auth.login_failed' => 'Inicio de sesión fallido',
            default => $action,
        };
    }
}
