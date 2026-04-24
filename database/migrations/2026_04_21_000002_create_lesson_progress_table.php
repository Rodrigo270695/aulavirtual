<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('enrollment_id');
            $table->uuid('lesson_id');
            $table->uuid('user_id');

            $table->string('status', 20)->default('not_started');
            $table->unsignedInteger('video_position_sec')->default(0);
            $table->decimal('watch_pct', 5, 2)->default(0);

            $table->timestampTz('completed_at')->nullable();
            $table->timestampTz('first_accessed_at')->nullable();
            $table->timestampTz('last_accessed_at')->nullable();

            $table->timestampsTz();

            $table->foreign('enrollment_id')->references('id')->on('enrollments')->cascadeOnDelete();
            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('lesson_progress', function (Blueprint $table) {
            $table->unique(['enrollment_id', 'lesson_id'], 'lesson_progress_enrollment_lesson_unique');
            $table->index('user_id');
            $table->index('enrollment_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_progress');
    }
};
