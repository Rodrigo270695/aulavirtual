<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('login_history', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->ipAddress('ip_address');
            $table->text('user_agent')->nullable();
            $table->char('country_code', 2)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('device_type', 20)->nullable();
            $table->string('browser', 50)->nullable();
            $table->string('os', 50)->nullable();

            $table->string('status', 20);
            $table->string('failure_reason', 100)->nullable();

            $table->timestampTz('created_at')->useCurrent();

            $table->index('user_id', 'idx_login_history_user');
            $table->index('ip_address', 'idx_login_history_ip');
            $table->index('created_at', 'idx_login_history_date');
            $table->index(['status', 'user_id'], 'idx_login_history_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_history');
    }
};
