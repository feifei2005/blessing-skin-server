<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class PassportClientSeeder extends Seeder
{
    public function run(): void
    {
        // 优先使用 SPA_URL 环境变量作为 OAuth 回调地址的域名，
        // 未设置时回退到 APP_URL（适用于同域部署）
        $spaUrl = env('SPA_URL', config('app.url'));

        Artisan::call('passport:client', [
            '--public' => true,
            '--name' => 'Blessing Skin SPA',
            '--redirect_uri' => rtrim($spaUrl, '/') . '/auth/callback',
            '--no-interaction' => true,
        ]);

        $output = Artisan::output();
        $this->command->info('已创建 Passport 公共客户端（SPA 用）。');
        $this->command->info('回调地址: ' . rtrim($spaUrl, '/') . '/auth/callback');

        // 尝试从输出中提取 Client ID
        if (preg_match('/Client ID[:\s]+(\d+)/', $output, $matches)) {
            $this->command->info('Client ID: ' . $matches[1]);
            $this->command->warn('请将此 Client ID 设置为 REACT_APP_OAUTH_CLIENT_ID 环境变量。');
        }
    }
}
