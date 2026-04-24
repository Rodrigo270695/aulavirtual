<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'cart_id',
        'item_type',
        'item_id',
        'title',
        'cover_image',
        'unit_price',
        'discount_price',
        'final_price',
        'added_at',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'discount_price' => 'decimal:2',
            'final_price' => 'decimal:2',
            'added_at' => 'datetime',
        ];
    }

    public function cart(): BelongsTo
    {
        return $this->belongsTo(ShoppingCart::class, 'cart_id');
    }
}

