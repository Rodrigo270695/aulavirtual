<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'instructor_id',
        'category_id',
        'title',
        'slug',
        'subtitle',
        'description',
        'language',
        'level',
        'status',
        'cover_image',
        'promo_video_url',
        'promo_video_path',
        'price',
        'discount_price',
        'discount_ends_at',
        'is_free',
        'currency',
        'duration_hours',
        'total_lessons',
        'total_modules',
        'total_enrolled',
        'avg_rating',
        'total_reviews',
        'certificate_enabled',
        'completion_threshold',
        'has_quiz',
        'has_assignments',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'discount_price' => 'decimal:2',
            'discount_ends_at' => 'datetime',
            'is_free' => 'boolean',
            'duration_hours' => 'decimal:2',
            'avg_rating' => 'decimal:2',
            'certificate_enabled' => 'boolean',
            'has_quiz' => 'boolean',
            'has_assignments' => 'boolean',
            'published_at' => 'datetime',
            'completion_threshold' => 'integer',
            'total_lessons' => 'integer',
            'total_modules' => 'integer',
            'total_enrolled' => 'integer',
            'total_reviews' => 'integer',
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

    public function requirements(): HasMany
    {
        return $this->hasMany(CourseRequirement::class)->orderBy('sort_order');
    }

    public function objectives(): HasMany
    {
        return $this->hasMany(CourseObjective::class)->orderBy('sort_order');
    }

    public function targetAudiences(): HasMany
    {
        return $this->hasMany(CourseTargetAudience::class)->orderBy('sort_order');
    }

    public function courseModules(): HasMany
    {
        return $this->hasMany(CourseModule::class)->orderBy('sort_order');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class, 'course_id')->orderBy('module_id')->orderBy('sort_order');
    }

    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function courseReviews(): HasMany
    {
        return $this->hasMany(CourseReview::class);
    }

    public function certificateTemplates(): HasMany
    {
        return $this->hasMany(CertificateTemplate::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'course_tags')
            ->using(CourseTag::class);
    }

    public function specializations(): BelongsToMany
    {
        return $this->belongsToMany(Specialization::class, 'specialization_courses')
            ->using(SpecializationCourse::class)
            ->withPivot(['sort_order', 'is_required'])
            ->orderByPivot('sort_order');
    }

    public function packages(): BelongsToMany
    {
        return $this->belongsToMany(Package::class, 'package_courses')
            ->using(PackageCourse::class)
            ->withPivot(['sort_order'])
            ->orderByPivot('sort_order');
    }
}
