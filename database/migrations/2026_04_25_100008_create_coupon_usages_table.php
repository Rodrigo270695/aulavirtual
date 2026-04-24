<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupon_usages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('coupon_id');
            $table->uuid('user_id');
            $table->uuid('order_id');
            $table->decimal('discount_applied', 12, 2);
            $table->timestampTz('used_at')->useCurrent();

            $table->foreign('coupon_id')->references('id')->on('coupons')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();

            $table->index('coupon_id', 'idx_coupon_usages_coupon');
            $table->index('user_id', 'idx_coupon_usages_user');
            $table->index('order_id', 'idx_coupon_usages_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupon_usages');
    }
};

