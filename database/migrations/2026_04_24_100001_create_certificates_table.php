<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('user_id');
            $table->uuid('enrollment_id');
            $table->uuid('template_id')->nullable();

            $table->uuid('course_id')->nullable();
            $table->uuid('specialization_id')->nullable();

            $table->string('verification_code', 32);
            $table->string('verification_url', 500);

            $table->string('student_name', 150);
            $table->string('course_title', 255);
            $table->string('instructor_name', 150)->nullable();

            $table->date('completion_date');
            $table->decimal('total_hours', 6, 2)->nullable();
            $table->decimal('final_score', 5, 2)->nullable();

            $table->string('pdf_path', 500)->nullable();

            $table->boolean('is_revoked')->default(false);
            $table->text('revoked_reason')->nullable();
            $table->timestampTz('revoked_at')->nullable();

            $table->timestampTz('issued_at')->useCurrent();

            $table->timestampsTz();
        });

        Schema::table('certificates', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('enrollment_id')->references('id')->on('enrollments')->cascadeOnDelete();
            $table->foreign('template_id')->references('id')->on('certificate_templates')->nullOnDelete();
            $table->foreign('course_id')->references('id')->on('courses')->nullOnDelete();
            $table->foreign('specialization_id')->references('id')->on('specializations')->nullOnDelete();

            $table->unique('verification_code', 'idx_certificates_code');
            $table->index('user_id', 'idx_certificates_user');
            $table->index('enrollment_id', 'idx_certificates_enrollment');
            $table->index('is_revoked', 'idx_certificates_revoked');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
