<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_id',
        'user_id',
        'gateway',
        'gateway_transaction_id',
        'gateway_order_id',
        'gateway_response',
        'amount',
        'currency',
        'payment_method',
        'card_last_four',
        'card_brand',
        'status',
        'failure_reason',
        'ip_address',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'gateway_response' => 'array',
            'amount' => 'decimal:2',
            'processed_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(\App\Models\Refund::class);
    }
}

