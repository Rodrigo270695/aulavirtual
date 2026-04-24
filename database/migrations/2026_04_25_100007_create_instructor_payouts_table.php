<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instructor_payouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('instructor_id');
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('gross_sales', 12, 2);
            $table->decimal('platform_fee', 12, 2);
            $table->decimal('net_amount', 12, 2);
            $table->char('currency', 3)->default('USD');
            $table->string('status', 20)->default('pending');
            $table->string('payment_reference', 255)->nullable();
            $table->timestampTz('paid_at')->nullable();
            $table->timestampsTz();

            $table->foreign('instructor_id')->references('id')->on('instructors')->cascadeOnDelete();

            $table->index('instructor_id', 'idx_payouts_instructor');
            $table->index('status', 'idx_payouts_status');
            $table->index(['period_start', 'period_end'], 'idx_payouts_period');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instructor_payouts');
    }
};

