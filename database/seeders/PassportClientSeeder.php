<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class PassportClientSeeder extends Seeder
{
    public function run(): void
    {
        Artisan::call('passport:client', [
            '--public' => true,
            '--name' => 'Blessing Skin SPA',
            '--redirect_uri' => config('app.url') . '/auth/callback',
            '--no-interaction' => true,
        ]);

        $this->command->info('Passport public client created for SPA.');
    }
}
