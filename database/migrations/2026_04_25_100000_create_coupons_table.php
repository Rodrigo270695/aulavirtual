<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50);
            $table->string('description', 255)->nullable();
            $table->string('discount_type', 20);
            $table->decimal('discount_value', 10, 2);
            $table->unsignedInteger('max_uses')->nullable();
            $table->unsignedSmallInteger('max_uses_per_user')->default(1);
            $table->unsignedInteger('current_uses')->default(0);
            $table->decimal('min_purchase_amount', 12, 2)->default(0);
            $table->string('applies_to', 20)->default('all');
            $table->uuid('applicable_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampTz('valid_from')->nullable();
            $table->timestampTz('valid_until')->nullable();
            $table->uuid('created_by');
            $table->timestampsTz();

            $table->foreign('created_by')->references('id')->on('users');
            $table->index('is_active', 'idx_coupons_active');
            $table->index(['valid_from', 'valid_until'], 'idx_coupons_validity');
        });

        DB::statement('CREATE UNIQUE INDEX idx_coupons_code ON coupons(UPPER(code))');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS idx_coupons_code');

        Schema::dropIfExists('coupons');
    }
};

