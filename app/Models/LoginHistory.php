<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginHistory extends Model
{
    use HasUuids;

    /** Solo `created_at` en BD (sin `updated_at`). */
    public $timestamps = false;

    protected $table = 'login_history';

    protected $fillable = [
        'user_id',
        'login_identifier',
        'ip_address',
        'user_agent',
        'country_code',
        'city',
        'device_type',
        'browser',
        'os',
        'status',
        'failure_reason',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (LoginHistory $row): void {
            if ($row->created_at === null) {
                $row->created_at = now();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
