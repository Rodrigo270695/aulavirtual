<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id');
            $table->uuid('user_id');
            $table->string('gateway', 30);
            $table->string('gateway_transaction_id', 255)->nullable();
            $table->string('gateway_order_id', 255)->nullable();
            $table->jsonb('gateway_response')->nullable();
            $table->decimal('amount', 12, 2);
            $table->char('currency', 3)->default('USD');
            $table->string('payment_method', 30)->nullable();
            $table->char('card_last_four', 4)->nullable();
            $table->string('card_brand', 20)->nullable();
            $table->string('status', 20)->default('pending');
            $table->text('failure_reason')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->timestampTz('processed_at')->nullable();
            $table->timestampsTz();

            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            $table->index('order_id', 'idx_payments_order');
            $table->index('user_id', 'idx_payments_user');
            $table->index('gateway_transaction_id', 'idx_payments_gateway_txn');
            $table->index('status', 'idx_payments_status');
            $table->index('created_at', 'idx_payments_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

