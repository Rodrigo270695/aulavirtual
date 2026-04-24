<?php

namespace App\Models;

use App\Models\NotificationDelivery;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Notification extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'notifiable_type',
        'notifiable_id',
        'type',
        'notification_type',
        'title',
        'body',
        'data',
        'category',
        'priority',
        'action_url',
        'action_text',
        'entity_type',
        'entity_id',
        'channel',
        'read_at',
        'archived_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'read_at' => 'datetime',
            'archived_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function notifiable(): MorphTo
    {
        return $this->morphTo();
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(NotificationDelivery::class);
    }
}
