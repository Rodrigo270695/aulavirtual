<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonDocument extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'lesson_id',
        'title',
        'file_path',
        'original_filename',
        'file_size_bytes',
        'mime_type',
        'is_downloadable',
        'download_count',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_downloadable' => 'boolean',
            'download_count' => 'integer',
            'sort_order' => 'integer',
            'file_size_bytes' => 'integer',
        ];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
