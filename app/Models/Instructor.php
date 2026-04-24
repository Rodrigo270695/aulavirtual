<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Instructor extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'professional_title',
        'specialization_area',
        'teaching_bio',
        'intro_video_url',
        'status',
        'approval_notes',
        'total_students',
        'total_courses',
        'avg_rating',
        'total_reviews',
        'revenue_share_pct',
        'payout_method',
        'payout_details_enc',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'total_students'    => 'integer',
            'total_courses'     => 'integer',
            'avg_rating'        => 'decimal:2',
            'total_reviews'     => 'integer',
            'revenue_share_pct' => 'decimal:2',
            'approved_at'       => 'datetime',
        ];
    }

    /**
     * Usuario base asociado al perfil de instructor.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function credentials(): HasMany
    {
        return $this->hasMany(InstructorCredential::class);
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    public function specializations(): HasMany
    {
        return $this->hasMany(Specialization::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(InstructorPayout::class);
    }
}
