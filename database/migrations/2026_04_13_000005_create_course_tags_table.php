<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Pivote cursos ↔ etiquetas (relación en App\Models\Course::tags / Tag::courses).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_tags', function (Blueprint $table) {
            $table->uuid('course_id');
            $table->uuid('tag_id');

            $table->primary(['course_id', 'tag_id']);

            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
            $table->foreign('tag_id')->references('id')->on('tags')->cascadeOnDelete();
        });

        DB::statement('CREATE INDEX idx_course_tags_tag ON course_tags(tag_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('course_tags');
    }
};
