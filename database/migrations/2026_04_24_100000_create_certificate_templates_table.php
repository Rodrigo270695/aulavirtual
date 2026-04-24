<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificate_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('course_id')->nullable();
            $table->uuid('specialization_id')->nullable();

            $table->string('name', 255);
            $table->text('template_html');
            $table->string('background_image', 500)->nullable();
            $table->string('signature_image', 500)->nullable();
            $table->string('signatory_name', 150)->nullable();
            $table->string('signatory_title', 150)->nullable();
            $table->string('institution_logo', 500)->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestampsTz();
        });

        Schema::table('certificate_templates', function (Blueprint $table) {
            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
            $table->foreign('specialization_id')->references('id')->on('specializations')->cascadeOnDelete();

            $table->index('course_id', 'idx_certificate_templates_course');
            $table->index('specialization_id', 'idx_certificate_templates_specialization');
            $table->index('is_active', 'idx_certificate_templates_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_templates');
    }
};
