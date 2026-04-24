<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Certificate extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'enrollment_id',
        'template_id',
        'course_id',
        'specialization_id',
        'verification_code',
        'verification_url',
        'student_name',
        'course_title',
        'instructor_name',
        'completion_date',
        'total_hours',
        'final_score',
        'pdf_path',
        'is_revoked',
        'revoked_reason',
        'revoked_at',
        'issued_at',
    ];

    protected function casts(): array
    {
        return [
            'completion_date' => 'date',
            'total_hours' => 'decimal:2',
            'final_score' => 'decimal:2',
            'is_revoked' => 'boolean',
            'revoked_at' => 'datetime',
            'issued_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(CertificateTemplate::class, 'template_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function specialization(): BelongsTo
    {
        return $this->belongsTo(Specialization::class);
    }

    public function verifications(): HasMany
    {
        return $this->hasMany(CertificateVerification::class);
    }
}
