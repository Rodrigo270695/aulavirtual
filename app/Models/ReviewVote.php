<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Voto «útil / no útil» sobre una reseña. Un usuario solo un voto por reseña (índice único review_id + user_id).
 */
class ReviewVote extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $table = 'review_votes';

    protected $fillable = [
        'review_id',
        'user_id',
        'is_helpful',
    ];

    protected function casts(): array
    {
        return [
            'is_helpful' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (ReviewVote $vote): void {
            if ($vote->created_at === null) {
                $vote->created_at = now();
            }
        });
    }

    public function review(): BelongsTo
    {
        return $this->belongsTo(CourseReview::class, 'review_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
