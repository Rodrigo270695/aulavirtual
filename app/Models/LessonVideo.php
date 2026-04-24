<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonVideo extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'lesson_id',
        'video_source',
        'external_url',
        'external_embed_url',
        'external_provider_video_id',
        'original_filename',
        'storage_path',
        'streaming_url',
        'thumbnail_path',
        'duration_seconds',
        'file_size_bytes',
        'resolution_480p',
        'resolution_720p',
        'resolution_1080p',
        'codec',
        'processing_status',
        'processing_error',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'duration_seconds' => 'integer',
            'file_size_bytes' => 'integer',
            'processed_at' => 'datetime',
        ];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
