<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_attempt_answers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('attempt_id');
            $table->uuid('question_id');

            $table->uuid('selected_option_id')->nullable();
            $table->text('text_answer')->nullable();
            $table->boolean('is_correct')->nullable();
            $table->decimal('points_earned', 5, 2)->default(0);
            $table->uuid('graded_by')->nullable();
            $table->timestampTz('graded_at')->nullable();
            $table->text('grader_comment')->nullable();

            $table->timestampsTz();

            $table->foreign('attempt_id')->references('id')->on('quiz_attempts')->cascadeOnDelete();
            $table->foreign('question_id')->references('id')->on('quiz_questions')->cascadeOnDelete();
            $table->foreign('selected_option_id')->references('id')->on('question_options')->nullOnDelete();
            $table->foreign('graded_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('quiz_attempt_answers', function (Blueprint $table) {
            $table->index('attempt_id');
            $table->index('question_id');
            $table->unique(['attempt_id', 'question_id'], 'quiz_attempt_answers_attempt_question_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempt_answers');
    }
};
