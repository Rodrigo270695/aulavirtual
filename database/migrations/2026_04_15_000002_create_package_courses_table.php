<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pivote paquetes ↔ cursos (orden de presentación).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('package_courses', function (Blueprint $table) {
            $table->uuid('package_id');
            $table->uuid('course_id');

            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->primary(['package_id', 'course_id']);

            $table->foreign('package_id')->references('id')->on('packages')->cascadeOnDelete();
            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('package_courses');
    }
};
