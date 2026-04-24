<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('quiz_id');

            $table->text('question_text');
            $table->string('question_type', 30);
            $table->text('explanation')->nullable();
            $table->string('image_path', 500)->nullable();
            $table->decimal('points', 5, 2)->default(1.00);
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestampsTz();

            $table->foreign('quiz_id')->references('id')->on('quizzes')->cascadeOnDelete();
        });

        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->index('quiz_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_questions');
    }
};
