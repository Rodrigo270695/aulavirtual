<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refunds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('payment_id');
            $table->uuid('order_id');
            $table->uuid('user_id');
            $table->text('reason');
            $table->decimal('amount', 12, 2);
            $table->string('status', 20)->default('pending');
            $table->text('admin_notes')->nullable();
            $table->string('gateway_refund_id', 255)->nullable();
            $table->uuid('reviewed_by')->nullable();
            $table->timestampTz('reviewed_at')->nullable();
            $table->timestampTz('processed_at')->nullable();
            $table->timestampsTz();

            $table->foreign('payment_id')->references('id')->on('payments')->cascadeOnDelete();
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();

            $table->index('payment_id', 'idx_refunds_payment');
            $table->index('user_id', 'idx_refunds_user');
            $table->index('status', 'idx_refunds_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refunds');
    }
};

