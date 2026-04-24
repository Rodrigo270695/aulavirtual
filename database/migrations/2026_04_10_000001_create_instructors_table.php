<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instructors', function (Blueprint $table) {
            // --- Identificación ---
            $table->uuid('id')->primary();

            // --- Relación 1:1 con users ---
            $table->uuid('user_id')->unique();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            // --- Perfil profesional ---
            $table->string('professional_title', 150);
            $table->string('specialization_area', 200)->nullable();
            $table->text('teaching_bio')->nullable();
            $table->string('intro_video_url', 500)->nullable();

            // --- Estado y revisión administrativa ---
            $table->string('status', 20)->default('pending')->comment('pending | active | suspended | rejected');
            $table->text('approval_notes')->nullable();

            // --- Métricas desnormalizadas ---
            $table->unsignedInteger('total_students')->default(0);
            $table->unsignedSmallInteger('total_courses')->default(0);
            $table->decimal('avg_rating', 3, 2)->default(0.00);
            $table->unsignedInteger('total_reviews')->default(0);

            // --- Monetización ---
            $table->decimal('revenue_share_pct', 5, 2)->default(70.00);
            $table->string('payout_method', 30)->nullable()->comment('bank_transfer | paypal | stripe_connect');
            $table->text('payout_details_enc')->nullable()->comment('Datos de pago cifrados en la app');

            // --- Auditoría ---
            $table->timestampTz('approved_at')->nullable();
            $table->timestampsTz();
        });

        // --- Índices ---
        DB::statement('CREATE INDEX idx_instructors_status ON instructors(status)');
        DB::statement('CREATE INDEX idx_instructors_rating ON instructors(avg_rating DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('instructors');
    }
};
