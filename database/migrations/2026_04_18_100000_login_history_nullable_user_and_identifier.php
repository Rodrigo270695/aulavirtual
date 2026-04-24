<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Permite registrar intentos fallidos sin usuario (correo inexistente)
 * y conservar el identificador intentado para la auditoría.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('login_history')) {
            return;
        }

        Schema::table('login_history', function (Blueprint $table) {
            if (! Schema::hasColumn('login_history', 'login_identifier')) {
                $table->string('login_identifier', 255)->nullable()->after('user_id');
            }
        });

        Schema::table('login_history', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('login_history', function (Blueprint $table) {
            $table->uuid('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('login_history')) {
            return;
        }

        Schema::table('login_history', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('login_history', function (Blueprint $table) {
            $table->uuid('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('login_history', function (Blueprint $table) {
            if (Schema::hasColumn('login_history', 'login_identifier')) {
                $table->dropColumn('login_identifier');
            }
        });
    }
};
