<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_modules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('course_id');

            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('sort_order');
            $table->boolean('is_free_preview')->default(false);
            $table->unsignedInteger('duration_minutes')->default(0);
            $table->unsignedSmallInteger('total_lessons')->default(0);

            $table->timestampsTz();

            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
        });

        Schema::table('course_modules', function (Blueprint $table) {
            $table->index(['course_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_modules');
    }
};
