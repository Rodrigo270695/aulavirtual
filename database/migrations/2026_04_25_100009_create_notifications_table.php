<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('notifiable_type', 100);
            $table->uuid('notifiable_id');
            $table->string('type', 255);
            $table->string('notification_type', 100)->default('system.generic');
            $table->string('title', 180)->default('');
            $table->text('body')->default('');
            $table->jsonb('data');
            $table->string('category', 30)->default('system');
            $table->string('priority', 15)->default('normal');
            $table->string('action_url', 500)->nullable();
            $table->string('action_text', 80)->nullable();
            $table->string('entity_type', 100)->nullable();
            $table->uuid('entity_id')->nullable();
            $table->string('channel', 20)->default('database');
            $table->timestampTz('read_at')->nullable();
            $table->timestampTz('archived_at')->nullable();
            $table->timestampTz('expires_at')->nullable();
            $table->timestampsTz();

            $table->index(['notifiable_type', 'notifiable_id'], 'idx_notifications_notifiable');
            $table->index('type', 'idx_notifications_type');
            $table->index('notification_type', 'idx_notifications_notification_type');
            $table->index(['category', 'priority'], 'idx_notifications_category');
            $table->index(['entity_type', 'entity_id'], 'idx_notifications_entity');
            $table->index('expires_at', 'idx_notifications_expiry');
        });

        DB::statement('CREATE INDEX idx_notifications_unread ON notifications(notifiable_id, read_at) WHERE read_at IS NULL');
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
