<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('module_id');
            $table->uuid('course_id');

            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('lesson_type', 20);
            $table->unsignedSmallInteger('sort_order');
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->boolean('is_free_preview')->default(false);
            $table->boolean('is_published')->default(false);
            $table->longText('content_text')->nullable();

            $table->timestampsTz();

            $table->foreign('module_id')->references('id')->on('course_modules')->cascadeOnDelete();
            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->index(['module_id', 'sort_order']);
            $table->index('course_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
