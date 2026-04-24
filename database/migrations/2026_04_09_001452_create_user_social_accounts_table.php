<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_social_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            // Proveedor OAuth y el ID único que nos da ese proveedor
            $table->string('provider', 30)->comment('google | github | microsoft | facebook');
            $table->string('provider_id', 255)->comment('ID único del usuario en el proveedor externo');

            // Tokens — se deben cifrar en la app antes de persistir
            $table->text('provider_token')->nullable()->comment('Access token (cifrado en app)');
            $table->text('provider_refresh_token')->nullable()->comment('Refresh token (cifrado en app)');
            $table->timestampTz('token_expires_at')->nullable();

            $table->timestampsTz();
        });

        // Un mismo perfil social no puede estar vinculado a dos usuarios distintos
        DB::statement('CREATE UNIQUE INDEX idx_social_provider ON user_social_accounts(provider, provider_id)');
        DB::statement('CREATE INDEX idx_social_user ON user_social_accounts(user_id)');

        // UUID por defecto a nivel de base de datos
        DB::statement('ALTER TABLE user_social_accounts ALTER COLUMN id SET DEFAULT gen_random_uuid()');
    }

    public function down(): void
    {
        Schema::dropIfExists('user_social_accounts');
    }
};
