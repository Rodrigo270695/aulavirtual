<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_deliveries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('notification_id');
            $table->uuid('user_id');
            $table->string('channel', 20);
            $table->string('status', 20)->default('queued');
            $table->string('recipient', 255)->nullable();
            $table->string('subject_snapshot', 255)->nullable();
            $table->string('provider', 50)->nullable();
            $table->string('provider_message_id', 255)->nullable();
            $table->text('error_message')->nullable();
            $table->timestampTz('sent_at')->nullable();
            $table->timestampTz('delivered_at')->nullable();
            $table->timestampsTz();

            $table->foreign('notification_id')->references('id')->on('notifications')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            $table->index('notification_id', 'idx_notif_deliveries_notification');
            $table->index('user_id', 'idx_notif_deliveries_user');
            $table->index(['status', 'channel'], 'idx_notif_deliveries_status');
            $table->index('provider_message_id', 'idx_notif_deliveries_provider_msg');
            $table->index('created_at', 'idx_notif_deliveries_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_deliveries');
    }
};
