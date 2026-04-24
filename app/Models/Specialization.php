<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Specialization extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'instructor_id',
        'category_id',
        'title',
        'slug',
        'description',
        'cover_image',
        'promo_video_url',
        'price',
        'discount_price',
        'discount_ends_at',
        'total_duration_hours',
        'total_courses',
        'difficulty_level',
        'status',
        'avg_rating',
        'total_enrolled',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'discount_price' => 'decimal:2',
            'discount_ends_at' => 'datetime',
            'total_duration_hours' => 'decimal:2',
            'total_courses' => 'integer',
            'avg_rating' => 'decimal:2',
            'total_enrolled' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(Instructor::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'specialization_courses')
            ->using(SpecializationCourse::class)
            ->withPivot(['sort_order', 'is_required'])
            ->orderByPivot('sort_order');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function certificateTemplates(): HasMany
    {
        return $this->hasMany(CertificateTemplate::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }
}
