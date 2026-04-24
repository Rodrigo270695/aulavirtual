<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_videos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('lesson_id');

            $table->string('video_source', 20)->default('upload');
            $table->string('external_url', 1000)->nullable();
            $table->string('external_embed_url', 1000)->nullable();
            $table->string('external_provider_video_id', 100)->nullable();
            $table->string('original_filename', 255)->nullable();
            $table->string('storage_path', 1000)->nullable();
            $table->string('streaming_url', 1000)->nullable();
            $table->string('thumbnail_path', 500)->nullable();
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->unsignedBigInteger('file_size_bytes')->nullable();
            $table->string('resolution_480p', 500)->nullable();
            $table->string('resolution_720p', 500)->nullable();
            $table->string('resolution_1080p', 500)->nullable();
            $table->string('codec', 20)->nullable();
            $table->string('processing_status', 20)->default('pending');
            $table->text('processing_error')->nullable();
            $table->timestampTz('processed_at')->nullable();

            $table->timestampsTz();

            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
        });

        Schema::table('lesson_videos', function (Blueprint $table) {
            $table->unique('lesson_id');
            $table->index('processing_status');
            $table->index('video_source');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_videos');
    }
};
