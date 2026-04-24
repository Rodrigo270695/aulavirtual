<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('packages', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('title', 255);
            $table->string('slug', 300);
            $table->text('description')->nullable();

            $table->string('cover_image', 500)->nullable();

            $table->decimal('original_price', 12, 2)->default(0);
            $table->decimal('package_price', 12, 2);
            $table->decimal('discount_pct', 5, 2)->default(0);

            $table->boolean('is_active')->default(true);
            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();

            $table->timestampsTz();
        });

        DB::statement('CREATE UNIQUE INDEX idx_packages_slug ON packages(slug)');
        DB::statement('CREATE INDEX idx_packages_active ON packages(is_active) WHERE is_active = true');
    }

    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};
