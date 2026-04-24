<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'course_id',
        'module_id',
        'lesson_id',
        'title',
        'description',
        'quiz_type',
        'time_limit_minutes',
        'max_attempts',
        'passing_score',
        'shuffle_questions',
        'shuffle_options',
        'show_answers_after',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'time_limit_minutes' => 'integer',
            'max_attempts' => 'integer',
            'passing_score' => 'decimal:2',
            'shuffle_questions' => 'boolean',
            'shuffle_options' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(CourseModule::class, 'module_id');
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('sort_order')->orderBy('created_at');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    /**
     * Elimina intentos «en curso» cuyo tiempo límite ya venció (no enviados).
     */
    public function purgeStaleTimedInProgressAttemptsFor(string $userId): void
    {
        $limitMin = (int) ($this->time_limit_minutes ?? 0);
        if ($limitMin <= 0) {
            return;
        }

        $threshold = now()->subMinutes($limitMin);

        QuizAttempt::query()
            ->where('quiz_id', $this->id)
            ->where('user_id', $userId)
            ->where('status', 'in_progress')
            ->where('started_at', '<', $threshold)
            ->delete();
    }
}
