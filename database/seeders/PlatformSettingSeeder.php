<?php

namespace Database\Seeders;

use App\Models\PlatformSetting;
use Illuminate\Database\Seeder;

class PlatformSettingSeeder extends Seeder
{
    public function run(): void
    {
        PlatformSetting::updateOrCreate(
            ['id' => 1],
            [
                'app_name'        => 'Aula Virtual',
                'app_tagline'     => 'Aprende sin límites, crece sin fronteras.',
                'logo_path'       => 'logo/logo.png',
                'icon_path'       => 'logo/icono.png',
                'favicon_path'    => 'logo/icono.png',
                'color_primary'   => '#1a56db',
                'color_secondary' => '#1e3a8a',
                'color_accent'    => '#35a0ff',
                'login_bg_from'   => '#0d1b6e',
                'login_bg_to'     => '#1a56db',
                'login_tagline'   => 'Accede a cursos de calidad en cualquier área del conocimiento.',
                'contact_email'   => null,
                'support_url'     => null,
                'terms_url'       => null,
                'privacy_url'     => null,
            ]
        );

        $this->command->info('✔ Platform settings inicializados con valores por defecto.');
    }
}
