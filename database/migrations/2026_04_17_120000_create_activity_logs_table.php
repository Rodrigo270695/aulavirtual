<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('action', 100);
            $table->string('subject_type', 100)->nullable();
            $table->uuid('subject_id')->nullable();

            $table->jsonb('old_values')->nullable();
            $table->jsonb('new_values')->nullable();

            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('session_id', 255)->nullable();
            $table->jsonb('extra_data')->nullable();

            $table->timestampTz('created_at')->useCurrent();

            $table->index('user_id', 'idx_activity_user');
            $table->index('action', 'idx_activity_action');
            $table->index(['subject_type', 'subject_id'], 'idx_activity_subject');
            $table->index('created_at', 'idx_activity_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
