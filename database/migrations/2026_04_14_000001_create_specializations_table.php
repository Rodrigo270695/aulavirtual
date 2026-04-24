<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('specializations', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('instructor_id');
            $table->uuid('category_id');

            $table->string('title', 255);
            $table->string('slug', 300);
            $table->text('description');

            $table->string('cover_image', 500)->nullable();
            $table->string('promo_video_url', 500)->nullable();

            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('discount_price', 12, 2)->nullable();
            $table->timestampTz('discount_ends_at')->nullable();

            $table->decimal('total_duration_hours', 6, 2)->default(0);
            $table->unsignedSmallInteger('total_courses')->default(0);
            $table->string('difficulty_level', 20)->default('intermediate');
            $table->string('status', 20)->default('draft')->comment('draft | published | archived');

            $table->decimal('avg_rating', 3, 2)->default(0);
            $table->unsignedInteger('total_enrolled')->default(0);

            $table->timestampTz('published_at')->nullable();

            $table->timestampsTz();
        });

        Schema::table('specializations', function (Blueprint $table) {
            $table->foreign('instructor_id')->references('id')->on('instructors')->restrictOnDelete();
            $table->foreign('category_id')->references('id')->on('categories')->restrictOnDelete();
        });

        DB::statement('CREATE UNIQUE INDEX idx_specializations_slug ON specializations(slug)');
        DB::statement('CREATE INDEX idx_specializations_status ON specializations(status)');
        DB::statement('CREATE INDEX idx_specializations_category ON specializations(category_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('specializations');
    }
};
