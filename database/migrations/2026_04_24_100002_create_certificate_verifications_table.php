<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificate_verifications', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('certificate_id');

            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->timestampTz('verified_at')->useCurrent();
        });

        Schema::table('certificate_verifications', function (Blueprint $table) {
            $table->foreign('certificate_id')->references('id')->on('certificates')->cascadeOnDelete();

            $table->index('certificate_id', 'idx_cert_verifications_cert');
            $table->index('verified_at', 'idx_cert_verifications_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_verifications');
    }
};
