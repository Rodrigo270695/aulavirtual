<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');

            $table->uuid('course_id')->nullable();
            $table->uuid('specialization_id')->nullable();
            $table->uuid('package_id')->nullable();

            /** FK a order_items cuando exista el módulo de pedidos; por ahora sin restricción referencial. */
            $table->uuid('order_item_id')->nullable();

            $table->string('access_type', 20)->default('paid');
            $table->string('status', 20)->default('active');

            $table->timestampTz('enrolled_at')->useCurrent();
            $table->timestampTz('expires_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampTz('last_accessed_at')->nullable();

            $table->decimal('progress_pct', 5, 2)->default(0);

            $table->timestampsTz();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('course_id')->references('id')->on('courses')->nullOnDelete();
            $table->foreign('specialization_id')->references('id')->on('specializations')->nullOnDelete();
            $table->foreign('package_id')->references('id')->on('packages')->nullOnDelete();
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('course_id');
            $table->index('specialization_id');
            $table->index('package_id');
            $table->index('status');
            $table->index(['last_accessed_at']);
        });

        // Un usuario solo una matrícula activa por curso (cuando course_id está definido).
        DB::statement('CREATE UNIQUE INDEX idx_enrollments_user_course ON enrollments (user_id, course_id) WHERE course_id IS NOT NULL');
        DB::statement('CREATE UNIQUE INDEX idx_enrollments_user_specialization ON enrollments (user_id, specialization_id) WHERE specialization_id IS NOT NULL');
        DB::statement('CREATE UNIQUE INDEX idx_enrollments_user_package ON enrollments (user_id, package_id) WHERE package_id IS NOT NULL');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS idx_enrollments_user_package');
        DB::statement('DROP INDEX IF EXISTS idx_enrollments_user_specialization');
        DB::statement('DROP INDEX IF EXISTS idx_enrollments_user_course');

        Schema::dropIfExists('enrollments');
    }
};
