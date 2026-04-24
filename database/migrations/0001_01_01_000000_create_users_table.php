<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Habilita gen_random_uuid() en PostgreSQL (extensión incluida en PostgreSQL 13+)
        DB::statement('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

        Schema::create('users', function (Blueprint $table) {
            // --- Identificación; HasUuids en el modelo genera el UUID automáticamente ---
            $table->uuid('id')->primary();

            // --- Nombre dividido para certificados, búsquedas y ordenamiento por apellido ---
            $table->string('first_name', 100);
            $table->string('last_name', 100);

            // --- Username opcional para URL de perfil público (/u/juan.perez); login siempre por email ---
            $table->string('username', 50)->nullable()->unique();

            // --- Autenticación; password nullable para usuarios que solo usan OAuth social ---
            $table->string('email', 255)->unique();
            $table->timestampTz('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->rememberToken();

            // --- Avatar almacenado en el propio hosting ---
            $table->string('avatar', 500)->nullable();

            // --- Documento de identidad: DNI (8 dígitos), CE, Pasaporte, Cédula, etc.
            //     VARCHAR para document_number porque los pasaportes contienen letras ---
            $table->string('document_type', 20)->nullable()->comment('dni | ce | passport | cedula | ruc');
            $table->string('document_number', 20)->nullable();

            // --- Teléfono separado en prefijo + número local para soportar múltiples países
            //     Perú: +51 + 9 dígitos | Venezuela: +58 + 10 dígitos | etc. ---
            $table->string('phone_country_code', 5)->nullable()->comment('Prefijo internacional: +51, +58, +57');
            $table->string('phone_number', 15)->nullable()->comment('Número local sin prefijo');

            // --- Localización ---
            $table->char('country_code', 2)->nullable()->comment('ISO 3166-1 alpha-2: PE, VE, CO, MX');
            $table->string('timezone', 60)->default('America/Lima');

            // --- Estado de la cuenta ---
            $table->boolean('is_active')->default(true);
            $table->boolean('is_banned')->default(false);
            $table->text('banned_reason')->nullable();

            // --- Auditoría de acceso ---
            $table->timestampTz('last_login_at')->nullable();

            $table->timestampsTz();
            $table->softDeletesTz();
        });

        // Asigna gen_random_uuid() como default a nivel de BD (defensa en profundidad)
        DB::statement('ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()');

        // --- Índices adicionales (unique parciales y compuestos) ---
        DB::statement('CREATE UNIQUE INDEX idx_users_document ON users(document_type, document_number) WHERE document_number IS NOT NULL');
        DB::statement('CREATE INDEX idx_users_fullname ON users(last_name, first_name)');
        DB::statement('CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true');
        DB::statement('CREATE INDEX idx_users_country ON users(country_code)');
        DB::statement('CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL');

        // --- Tokens de recuperación de contraseña ---
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestampTz('created_at')->nullable();
        });

        // --- Sesiones de Laravel (driver: database) ---
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->uuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
