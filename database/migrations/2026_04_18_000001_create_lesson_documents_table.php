<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('lesson_id');

            $table->string('title', 255);
            $table->string('file_path', 1000);
            $table->string('original_filename', 255);
            $table->unsignedBigInteger('file_size_bytes')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->boolean('is_downloadable')->default(true);
            $table->unsignedInteger('download_count')->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestampsTz();

            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
        });

        Schema::table('lesson_documents', function (Blueprint $table) {
            $table->index(['lesson_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_documents');
    }
};
