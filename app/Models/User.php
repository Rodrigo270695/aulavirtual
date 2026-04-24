<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable([
    'first_name',
    'last_name',
    'username',
    'email',
    'password',
    'avatar',
    'document_type',
    'document_number',
    'phone_country_code',
    'phone_number',
    'country_code',
    'timezone',
    'is_active',
    'email_verified_at',
    'is_banned',
    'banned_reason',
])]
#[Hidden([
    'password',
    'two_factor_secret',
    'two_factor_recovery_codes',
    'remember_token',
    'banned_reason',
])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasUuids, SoftDeletes, HasRoles;

    /**
     * Nombre completo concatenado: "Juan Carlos Pérez Rojas"
     * Usado en certificados, notificaciones y UI.
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    /**
     * Teléfono completo con prefijo internacional: "+51 987654321"
     */
    public function getFullPhoneAttribute(): ?string
    {
        if (! $this->phone_number) {
            return null;
        }

        return trim("{$this->phone_country_code} {$this->phone_number}");
    }

    /**
     * Números de documento que no deben alterarse (cuenta de demo / producción protegida).
     *
     * @var list<string>
     */
    public const IMMUTABLE_DEMO_DOCUMENT_NUMBERS = [
        '77344506',
    ];

    /**
     * Indica si el número de documento corresponde a una cuenta inmutable en demos.
     */
    public static function isImmutableDemoDocument(?string $documentNumber): bool
    {
        $n = $documentNumber !== null ? trim($documentNumber) : '';

        if ($n === '') {
            return false;
        }

        return in_array($n, self::IMMUTABLE_DEMO_DOCUMENT_NUMBERS, true);
    }

    public function isImmutableDemoAccount(): bool
    {
        return self::isImmutableDemoDocument($this->document_number);
    }

    /**
     * Solo rol estudiante (marketplace), sin acceso a panel administrativo ni dashboard de staff.
     */
    public function isStudentOnly(): bool
    {
        return $this->getRoleNames()->count() === 1 && $this->hasRole('student');
    }

    // ─── Relaciones ───────────────────────────────────────────────────────────

    /**
     * Perfil extendido del usuario (1:1).
     * Uso: $user->profile->bio
     */
    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    /**
     * Perfil de instructor del usuario (1:1).
     */
    public function instructor(): HasOne
    {
        return $this->hasOne(Instructor::class);
    }

    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function gradedQuizAnswers(): HasMany
    {
        return $this->hasMany(QuizAttemptAnswer::class, 'graded_by');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function lessonProgress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function courseReviews(): HasMany
    {
        return $this->hasMany(CourseReview::class);
    }

    public function moderatedCourseReviews(): HasMany
    {
        return $this->hasMany(CourseReview::class, 'moderated_by');
    }

    public function reviewVotes(): HasMany
    {
        return $this->hasMany(ReviewVote::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    /**
     * Cupones creados por este usuario (admin/instructor).
     */
    public function createdCoupons(): HasMany
    {
        return $this->hasMany(Coupon::class, 'created_by');
    }

    /**
     * Historial de usos de cupones del usuario.
     */
    public function couponUsages(): HasMany
    {
        return $this->hasMany(CouponUsage::class);
    }

    public function shoppingCart(): HasOne
    {
        return $this->hasOne(ShoppingCart::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    public function reviewedRefunds(): HasMany
    {
        return $this->hasMany(Refund::class, 'reviewed_by');
    }

    public function notificationPreferences(): HasMany
    {
        return $this->hasMany(NotificationPreference::class);
    }

    public function appNotifications(): MorphMany
    {
        return $this->morphMany(Notification::class, 'notifiable');
    }

    public function notificationDeliveries(): HasMany
    {
        return $this->hasMany(NotificationDelivery::class);
    }

    /**
     * Registros de auditoría (acciones relevantes atribuidas a este usuario).
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Intentos de inicio de sesión asociados a este usuario.
     */
    public function loginHistory(): HasMany
    {
        return $this->hasMany(LoginHistory::class);
    }

    // ─── Casts ────────────────────────────────────────────────────────────────

    /**
     * Cast de atributos.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at'        => 'datetime',
            'last_login_at'            => 'datetime',
            'password'                 => 'hashed',
            'two_factor_confirmed_at'  => 'datetime',
            'is_active'                => 'boolean',
            'is_banned'                => 'boolean',
        ];
    }
}
