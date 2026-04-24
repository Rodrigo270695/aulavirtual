<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizAttempt extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'quiz_id',
        'user_id',
        'attempt_number',
        'status',
        'score',
        'total_points',
        'obtained_points',
        'is_passed',
        'started_at',
        'submitted_at',
        'time_spent_seconds',
    ];

    protected function casts(): array
    {
        return [
            'attempt_number' => 'integer',
            'score' => 'decimal:2',
            'total_points' => 'decimal:2',
            'obtained_points' => 'decimal:2',
            'is_passed' => 'boolean',
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
            'time_spent_seconds' => 'integer',
        ];
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(QuizAttemptAnswer::class, 'attempt_id');
    }
}
