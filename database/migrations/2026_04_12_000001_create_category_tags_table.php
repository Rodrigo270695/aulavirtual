<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_tags', function (Blueprint $table) {
            $table->uuid('category_id');
            $table->uuid('tag_id');

            $table->primary(['category_id', 'tag_id']);

            $table->foreign('category_id')->references('id')->on('categories')->cascadeOnDelete();
            $table->foreign('tag_id')->references('id')->on('tags')->cascadeOnDelete();
        });

        DB::statement('CREATE INDEX idx_category_tags_tag ON category_tags(tag_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('category_tags');
    }
};
