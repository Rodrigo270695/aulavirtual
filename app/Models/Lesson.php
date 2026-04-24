<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Lesson extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'module_id',
        'course_id',
        'title',
        'description',
        'lesson_type',
        'sort_order',
        'duration_seconds',
        'is_free_preview',
        'is_published',
        'content_text',
        'has_homework',
        'homework_title',
        'homework_instructions',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'duration_seconds' => 'integer',
            'is_free_preview' => 'boolean',
            'is_published' => 'boolean',
            'has_homework' => 'boolean',
        ];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(CourseModule::class, 'module_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(LessonDocument::class)->orderBy('sort_order')->orderBy('created_at');
    }

    public function lessonResources(): HasMany
    {
        return $this->hasMany(LessonResource::class)->orderBy('sort_order')->orderBy('created_at');
    }

    public function video(): HasOne
    {
        return $this->hasOne(LessonVideo::class);
    }

    public function quiz(): HasOne
    {
        return $this->hasOne(Quiz::class);
    }

    public function lessonProgress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function homeworkDeliverables(): HasMany
    {
        return $this->hasMany(LessonHomeworkDeliverable::class);
    }
}
