<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pivote especializaciones ↔ cursos (orden y obligatoriedad para certificado).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('specialization_courses', function (Blueprint $table) {
            $table->uuid('specialization_id');
            $table->uuid('course_id');

            $table->unsignedSmallInteger('sort_order');
            $table->boolean('is_required')->default(true);

            $table->primary(['specialization_id', 'course_id']);

            $table->foreign('specialization_id')->references('id')->on('specializations')->cascadeOnDelete();
            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('specialization_courses');
    }
};
