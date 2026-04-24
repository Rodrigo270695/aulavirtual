<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * Pivote curso ↔ etiqueta (`course_tags`).
 */
class CourseTag extends Pivot
{
    protected $table = 'course_tags';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'course_id',
        'tag_id',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function tag(): BelongsTo
    {
        return $this->belongsTo(Tag::class);
    }
}
