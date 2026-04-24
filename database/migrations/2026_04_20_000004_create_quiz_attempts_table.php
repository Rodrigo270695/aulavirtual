<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('quiz_id');
            $table->uuid('user_id');

            $table->unsignedSmallInteger('attempt_number');
            $table->string('status', 20)->default('in_progress');
            $table->decimal('score', 5, 2)->nullable();
            $table->decimal('total_points', 7, 2)->nullable();
            $table->decimal('obtained_points', 7, 2)->nullable();
            $table->boolean('is_passed')->nullable();
            $table->timestampTz('started_at');
            $table->timestampTz('submitted_at')->nullable();
            $table->unsignedInteger('time_spent_seconds')->nullable();

            $table->timestampsTz();

            $table->foreign('quiz_id')->references('id')->on('quizzes')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->index('quiz_id');
            $table->index('user_id');
            $table->unique(['quiz_id', 'user_id', 'attempt_number'], 'quiz_attempts_quiz_user_attempt_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
    }
};
