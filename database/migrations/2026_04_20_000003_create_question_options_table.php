<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_options', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('question_id');

            $table->text('option_text');
            $table->boolean('is_correct')->default(false);
            $table->text('explanation')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestampsTz();

            $table->foreign('question_id')->references('id')->on('quiz_questions')->cascadeOnDelete();
        });

        Schema::table('question_options', function (Blueprint $table) {
            $table->index('question_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_options');
    }
};
