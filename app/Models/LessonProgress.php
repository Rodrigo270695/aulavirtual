<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonProgress extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'lesson_progress';

    protected $fillable = [
        'enrollment_id',
        'lesson_id',
        'user_id',
        'status',
        'video_position_sec',
        'watch_pct',
        'completed_at',
        'first_accessed_at',
        'last_accessed_at',
    ];

    protected function casts(): array
    {
        return [
            'video_position_sec' => 'integer',
            'watch_pct' => 'decimal:2',
            'completed_at' => 'datetime',
            'first_accessed_at' => 'datetime',
            'last_accessed_at' => 'datetime',
        ];
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
