<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instructor_credentials', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('instructor_id');
            $table->foreign('instructor_id')->references('id')->on('instructors')->cascadeOnDelete();

            $table->string('credential_type', 50);
            $table->string('title', 255);
            $table->string('institution', 200);
            $table->date('obtained_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('credential_url', 500)->nullable();
            $table->string('document_path', 500)->nullable();

            $table->boolean('is_verified')->default(false);
            $table->uuid('verified_by')->nullable();
            $table->foreign('verified_by')->references('id')->on('users')->nullOnDelete();
            $table->timestampTz('verified_at')->nullable();

            $table->timestampsTz();
        });

        DB::statement('CREATE INDEX idx_credentials_instructor ON instructor_credentials(instructor_id)');
        DB::statement('CREATE INDEX idx_credentials_verified ON instructor_credentials(is_verified)');
    }

    public function down(): void
    {
        Schema::dropIfExists('instructor_credentials');
    }
};
