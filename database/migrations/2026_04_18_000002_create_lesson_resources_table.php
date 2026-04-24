<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_resources', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('lesson_id');

            $table->string('resource_type', 30);
            $table->string('title', 255);
            $table->string('url', 1000);
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestampsTz();

            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
        });

        Schema::table('lesson_resources', function (Blueprint $table) {
            $table->index(['lesson_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_resources');
    }
};
