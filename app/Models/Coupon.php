<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'code',
        'description',
        'discount_type',
        'discount_value',
        'max_uses',
        'max_uses_per_user',
        'current_uses',
        'min_purchase_amount',
        'applies_to',
        'applicable_id',
        'is_active',
        'valid_from',
        'valid_until',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'max_uses' => 'integer',
            'max_uses_per_user' => 'integer',
            'current_uses' => 'integer',
            'min_purchase_amount' => 'decimal:2',
            'is_active' => 'boolean',
            'valid_from' => 'datetime',
            'valid_until' => 'datetime',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function usages(): HasMany
    {
        return $this->hasMany(\App\Models\CouponUsage::class, 'coupon_id');
    }

    public function carts(): HasMany
    {
        return $this->hasMany(ShoppingCart::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}

