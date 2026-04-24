<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('course_id');
            $table->uuid('user_id');
            $table->uuid('enrollment_id');

            $table->unsignedTinyInteger('rating');
            $table->string('title', 255)->nullable();
            $table->text('review_text')->nullable();
            $table->text('pros')->nullable();
            $table->text('cons')->nullable();

            $table->string('status', 20)->default('published');
            $table->unsignedInteger('helpful_count')->default(0);

            $table->text('instructor_response')->nullable();
            $table->timestampTz('instructor_replied_at')->nullable();

            $table->uuid('moderated_by')->nullable();
            $table->timestampTz('moderated_at')->nullable();

            $table->timestampsTz();

            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('enrollment_id')->references('id')->on('enrollments')->cascadeOnDelete();
            $table->foreign('moderated_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('course_reviews', function (Blueprint $table) {
            $table->unique(['course_id', 'user_id'], 'idx_course_reviews_course_user_unique');
            $table->index('course_id', 'idx_course_reviews_course');
            $table->index(['course_id', 'rating'], 'idx_course_reviews_course_rating');
            $table->index('status', 'idx_course_reviews_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_reviews');
    }
};
