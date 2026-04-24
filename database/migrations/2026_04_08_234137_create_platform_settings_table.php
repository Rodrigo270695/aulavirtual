<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_settings', function (Blueprint $table) {
            // Una sola fila de configuración; el id siempre será 1 (bigint simple)
            $table->id();

            // --- Identidad de la plataforma ---
            $table->string('app_name', 100)->default('Aula Virtual');
            $table->string('app_tagline', 255)->nullable()->comment('Frase corta debajo del nombre');

            // --- Imágenes ---
            // logo_path  : logo completo (texto + ícono) para sidebar expandido y marketing
            // icon_path  : solo el ícono para sidebar colapsado, favicon, etc.
            $table->string('logo_path', 500)->nullable()->comment('Ruta del logo completo (PNG/SVG)');
            $table->string('icon_path', 500)->nullable()->comment('Ruta del ícono solo (cuadrado, PNG/SVG)');
            $table->string('favicon_path', 500)->nullable()->comment('Ruta del favicon (.ico / .png)');

            // --- Paleta de marca (3 colores en formato HEX #RRGGBB) ---
            // Se exponen al frontend y se inyectan como CSS vars en tiempo real
            $table->string('color_primary', 20)->default('#1a56db')->comment('Color principal (botones, accent)');
            $table->string('color_secondary', 20)->default('#1e3a8a')->comment('Color secundario (sidebar, fondos)');
            $table->string('color_accent', 20)->default('#35a0ff')->comment('Color de resalte / hover');

            // --- Configuración del login ---
            $table->string('login_bg_from', 20)->default('#0d1b6e')->comment('Gradiente inicio (panel izquierdo login)');
            $table->string('login_bg_to', 20)->default('#1a56db')->comment('Gradiente fin');
            $table->text('login_tagline')->nullable()->comment('Texto marketing en el panel izquierdo del login');

            // --- Configuración general ---
            $table->string('contact_email', 255)->nullable();
            $table->string('support_url', 500)->nullable();
            $table->string('terms_url', 500)->nullable();
            $table->string('privacy_url', 500)->nullable();

            // --- Redes sociales ---
            $table->string('social_facebook', 500)->nullable();
            $table->string('social_instagram', 500)->nullable();
            $table->string('social_linkedin', 500)->nullable();
            $table->string('social_youtube', 500)->nullable();

            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_settings');
    }
};
