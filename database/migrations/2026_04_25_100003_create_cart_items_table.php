<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('cart_id');
            $table->string('item_type', 20);
            $table->uuid('item_id');
            $table->string('title', 255);
            $table->string('cover_image', 500)->nullable();
            $table->decimal('unit_price', 12, 2);
            $table->decimal('discount_price', 12, 2)->nullable();
            $table->decimal('final_price', 12, 2);
            $table->timestampTz('added_at')->useCurrent();

            $table->foreign('cart_id')->references('id')->on('shopping_carts')->cascadeOnDelete();

            $table->index('cart_id', 'idx_cart_items_cart');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_items');
    }
};

