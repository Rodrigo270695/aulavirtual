<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tags', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('name', 80);
            $table->string('slug', 100);
            $table->unsignedInteger('usage_count')->default(0);

            $table->timestampTz('created_at')->useCurrent();
        });

        DB::statement('CREATE UNIQUE INDEX idx_tags_name ON tags(name)');
        DB::statement('CREATE UNIQUE INDEX idx_tags_slug ON tags(slug)');
        DB::statement('CREATE INDEX idx_tags_usage ON tags(usage_count DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('tags');
    }
};
