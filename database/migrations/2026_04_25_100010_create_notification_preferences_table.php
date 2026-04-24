<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('notification_type', 100);
            $table->boolean('email_enabled')->default(true);
            $table->boolean('push_enabled')->default(true);
            $table->boolean('in_app_enabled')->default(true);
            $table->string('frequency', 20)->default('instant');
            $table->time('quiet_hours_start')->nullable();
            $table->time('quiet_hours_end')->nullable();
            $table->string('timezone', 64)->nullable();
            $table->timestampsTz();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            $table->unique(['user_id', 'notification_type'], 'uniq_notif_prefs_user_type');
            $table->index('user_id', 'idx_notif_prefs_user');
            $table->index('notification_type', 'idx_notif_prefs_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }
};
