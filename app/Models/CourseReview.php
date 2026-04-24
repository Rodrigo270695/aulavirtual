<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourseReview extends Model
{
    use HasUuids;

    protected $table = 'course_reviews';

    protected $fillable = [
        'course_id',
        'user_id',
        'enrollment_id',
        'rating',
        'title',
        'review_text',
        'pros',
        'cons',
        'status',
        'helpful_count',
        'instructor_response',
        'instructor_replied_at',
        'moderated_by',
        'moderated_at',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'helpful_count' => 'integer',
            'instructor_replied_at' => 'datetime',
            'moderated_at' => 'datetime',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function moderator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moderated_by');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(ReviewVote::class, 'review_id');
    }
}
