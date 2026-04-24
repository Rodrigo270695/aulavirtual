<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            // --- Identificación ---
            $table->uuid('id')->primary();

            // --- Relación 1:1 con users; cada usuario tiene un único perfil ---
            $table->uuid('user_id')->unique();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            // --- Presentación pública ---
            $table->text('bio')->nullable()->comment('Presentación personal visible en el perfil público');
            $table->string('headline', 200)->nullable()->comment('Titular profesional: "Ing. Civil - PhD candidate"');

            // --- Redes sociales y web personal ---
            $table->string('website_url', 500)->nullable();
            $table->string('linkedin_url', 500)->nullable();
            $table->string('github_url', 500)->nullable()->comment('Relevante para ingenieros de software');
            $table->string('youtube_url', 500)->nullable();

            // --- Datos personales opcionales ---
            $table->string('gender', 20)->nullable()->comment('Sin restricción de valores para respetar diversidad');
            $table->date('birthdate')->nullable()->comment('Fecha de nacimiento para estadísticas demográficas');

            // --- Perfil académico y profesional ---
            $table->string('engineering_field', 100)->nullable()->comment('Especialidad: Civil, Mecánica, Sistemas, etc.');
            $table->string('academic_level', 50)->nullable()->comment('técnico | pregrado | postgrado | doctorado');
            $table->string('university', 200)->nullable()->comment('Institución de estudio o trabajo actual');
            $table->smallInteger('graduation_year')->nullable()->comment('Año de graduación o egreso');
            $table->smallInteger('years_experience')->nullable()->comment('Años de experiencia profesional en su campo');

            $table->timestampsTz();
        });

        // --- Índices ---
        // Búsqueda por especialidad de ingeniería para recomendaciones y filtros
        DB::statement('CREATE INDEX idx_user_profiles_field ON user_profiles(engineering_field)');
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
