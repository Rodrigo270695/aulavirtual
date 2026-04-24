<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * Pivote especialización ↔ curso (`specialization_courses`).
 */
class SpecializationCourse extends Pivot
{
    protected $table = 'specialization_courses';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'specialization_id',
        'course_id',
        'sort_order',
        'is_required',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_required' => 'boolean',
        ];
    }

    public function specialization(): BelongsTo
    {
        return $this->belongsTo(Specialization::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
