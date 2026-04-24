<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'bio',
        'headline',
        'website_url',
        'linkedin_url',
        'github_url',
        'youtube_url',
        'gender',
        'birthdate',
        'engineering_field',
        'academic_level',
        'university',
        'graduation_year',
        'years_experience',
    ];

    protected function casts(): array
    {
        return [
            'birthdate'       => 'date',
            'graduation_year' => 'integer',
            'years_experience'=> 'integer',
        ];
    }

    // ─── Relaciones ───────────────────────────────────────────────────────────

    /**
     * Usuario al que pertenece este perfil (relación inversa 1:1).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    /**
     * Edad calculada desde la fecha de nacimiento.
     * Devuelve null si no hay fecha registrada.
     */
    public function getAgeAttribute(): ?int
    {
        return $this->birthdate?->age;
    }

    /**
     * Indica si el perfil tiene al menos una red social vinculada.
     */
    public function getHasSocialLinksAttribute(): bool
    {
        return filled($this->linkedin_url)
            || filled($this->github_url)
            || filled($this->youtube_url)
            || filled($this->website_url);
    }
}
