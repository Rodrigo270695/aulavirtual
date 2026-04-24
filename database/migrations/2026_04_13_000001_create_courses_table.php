<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('instructor_id');
            $table->uuid('category_id');

            $table->string('title', 255);
            $table->string('slug', 300);
            $table->string('subtitle', 400)->nullable();
            $table->text('description');

            $table->string('language', 10)->default('es');
            $table->string('level', 20)->comment('beginner | intermediate | advanced | all_levels');
            $table->string('status', 20)->default('draft')->comment('draft | under_review | published | unpublished | archived');

            $table->string('cover_image', 500)->nullable();
            $table->string('promo_video_url', 500)->nullable();

            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('discount_price', 12, 2)->nullable();
            $table->timestampTz('discount_ends_at')->nullable();
            $table->boolean('is_free')->default(false);
            $table->char('currency', 3)->default('USD');

            $table->decimal('duration_hours', 6, 2)->default(0);
            $table->unsignedSmallInteger('total_lessons')->default(0);
            $table->unsignedSmallInteger('total_modules')->default(0);
            $table->unsignedInteger('total_enrolled')->default(0);
            $table->decimal('avg_rating', 3, 2)->default(0);
            $table->unsignedInteger('total_reviews')->default(0);

            $table->boolean('certificate_enabled')->default(true);
            $table->unsignedSmallInteger('completion_threshold')->default(80);
            $table->boolean('has_quiz')->default(false);
            $table->boolean('has_assignments')->default(false);

            $table->timestampTz('published_at')->nullable();

            $table->timestampsTz();
            $table->softDeletesTz();
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->foreign('instructor_id')->references('id')->on('instructors')->restrictOnDelete();
            $table->foreign('category_id')->references('id')->on('categories')->restrictOnDelete();
        });

        DB::statement('CREATE UNIQUE INDEX idx_courses_slug ON courses(slug)');
        DB::statement('CREATE INDEX idx_courses_instructor ON courses(instructor_id)');
        DB::statement('CREATE INDEX idx_courses_category ON courses(category_id)');
        DB::statement('CREATE INDEX idx_courses_status ON courses(status)');
        DB::statement('CREATE INDEX idx_courses_price ON courses(price)');
        DB::statement('CREATE INDEX idx_courses_level ON courses(level)');
        DB::statement('CREATE INDEX idx_courses_is_free ON courses(is_free)');
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
