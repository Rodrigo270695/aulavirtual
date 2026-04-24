<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('parent_id')->nullable();

            $table->string('name', 100);
            $table->string('slug', 120);
            $table->text('description')->nullable();
            $table->string('icon', 100)->nullable();
            $table->string('cover_image', 500)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestampsTz();
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('categories')->nullOnDelete();
        });

        DB::statement('CREATE UNIQUE INDEX idx_categories_slug ON categories(slug)');
        DB::statement('CREATE INDEX idx_categories_parent ON categories(parent_id)');
        DB::statement('CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = true');
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
