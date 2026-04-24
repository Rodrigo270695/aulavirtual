<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id');
            $table->string('item_type', 20);
            $table->uuid('item_id');
            $table->string('title', 255);
            $table->uuid('instructor_id')->nullable();
            $table->decimal('unit_price', 12, 2);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('final_price', 12, 2);
            $table->decimal('instructor_revenue', 12, 2)->default(0);
            $table->decimal('platform_revenue', 12, 2)->default(0);
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->foreign('instructor_id')->references('id')->on('instructors')->nullOnDelete();

            $table->index('order_id', 'idx_order_items_order');
            $table->index('instructor_id', 'idx_order_items_instructor');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};

