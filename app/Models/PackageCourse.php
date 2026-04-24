<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * Pivote paquete ↔ curso (`package_courses`).
 */
class PackageCourse extends Pivot
{
    protected $table = 'package_courses';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'package_id',
        'course_id',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
