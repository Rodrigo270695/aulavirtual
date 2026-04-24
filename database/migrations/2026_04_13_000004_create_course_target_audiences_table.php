<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_target_audiences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('course_id');
            $table->string('description', 500);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestampTz('created_at')->useCurrent();
        });

        Schema::table('course_target_audiences', function (Blueprint $table) {
            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
        });

        DB::statement('CREATE INDEX idx_target_audience_course ON course_target_audiences(course_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('course_target_audiences');
    }
};
