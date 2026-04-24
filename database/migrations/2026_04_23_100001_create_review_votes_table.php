<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('review_votes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('review_id');
            $table->uuid('user_id');
            $table->boolean('is_helpful');
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['review_id', 'user_id'], 'idx_review_votes_review_user_unique');

            $table->foreign('review_id')->references('id')->on('course_reviews')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_votes');
    }
};
