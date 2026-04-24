<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * users.id es UUID nativo en PostgreSQL; model_has_roles / model_has_permissions
 * usan model_uuid como string y el join de Spatie falla (uuid = varchar).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        if (Schema::hasTable('model_has_roles')) {
            DB::statement('ALTER TABLE model_has_roles ALTER COLUMN model_uuid TYPE uuid USING model_uuid::uuid');
        }

        if (Schema::hasTable('model_has_permissions')) {
            DB::statement('ALTER TABLE model_has_permissions ALTER COLUMN model_uuid TYPE uuid USING model_uuid::uuid');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        if (Schema::hasTable('model_has_roles')) {
            DB::statement('ALTER TABLE model_has_roles ALTER COLUMN model_uuid TYPE character varying(255) USING model_uuid::text');
        }

        if (Schema::hasTable('model_has_permissions')) {
            DB::statement('ALTER TABLE model_has_permissions ALTER COLUMN model_uuid TYPE character varying(255) USING model_uuid::text');
        }
    }
};
