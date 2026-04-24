<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quizzes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('course_id');
            $table->uuid('module_id')->nullable();
            $table->uuid('lesson_id')->nullable();

            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('quiz_type', 20)->default('formative');
            $table->unsignedSmallInteger('time_limit_minutes')->nullable();
            $table->smallInteger('max_attempts')->default(3);
            $table->decimal('passing_score', 5, 2)->default(60.00);
            $table->boolean('shuffle_questions')->default(false);
            $table->boolean('shuffle_options')->default(false);
            $table->string('show_answers_after', 20)->default('submission');
            $table->boolean('is_active')->default(true);

            $table->timestampsTz();

            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
            $table->foreign('module_id')->references('id')->on('course_modules')->nullOnDelete();
            $table->foreign('lesson_id')->references('id')->on('lessons')->nullOnDelete();
        });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->index('course_id');
            $table->index('module_id');
            $table->index('lesson_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};
