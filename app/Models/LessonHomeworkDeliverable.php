<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonHomeworkDeliverable extends Model
{
    use HasUuids;

    protected $table = 'lesson_homework_deliverables';

    protected $fillable = [
        'enrollment_id',
        'lesson_id',
        'user_id',
        'file_path',
        'original_filename',
        'file_size_bytes',
        'mime_type',
    ];

    protected function casts(): array
    {
        return [
            'file_size_bytes' => 'integer',
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
