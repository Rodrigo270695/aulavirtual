<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('order_number', 30);
            $table->uuid('user_id');
            $table->uuid('coupon_id')->nullable();
            $table->string('status', 20)->default('pending');
            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->char('currency', 3)->default('USD');
            $table->string('billing_name', 150)->nullable();
            $table->string('billing_email', 255)->nullable();
            $table->text('billing_address')->nullable();
            $table->text('notes')->nullable();
            $table->timestampTz('paid_at')->nullable();
            $table->timestampsTz();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('coupon_id')->references('id')->on('coupons')->nullOnDelete();

            $table->unique('order_number', 'idx_orders_number');
            $table->index('user_id', 'idx_orders_user');
            $table->index('status', 'idx_orders_status');
            $table->index('created_at', 'idx_orders_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};

