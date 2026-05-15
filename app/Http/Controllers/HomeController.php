<?php

namespace App\Http\Controllers;

use App\Services\PluginManager;
use Illuminate\Support\Arr;

class HomeController extends Controller
{
    public function index()
    {
        $spaUrl = env('SPA_URL', config('app.url'));
        return redirect($spaUrl, 302);
    }

    public function apiRoot()
    {
        $copyright = Arr::get(
            [
                'Powered with ❤ by Blessing Skin Server.',
                'Powered by Blessing Skin Server.',
                'Proudly powered by Blessing Skin Server.',
                '由 Blessing Skin Server 强力驱动。',
                '采用 Blessing Skin Server 搭建。',
                '使用 Blessing Skin Server 稳定运行。',
                '自豪地采用 Blessing Skin Server。',
            ],
            option_localized('copyright_prefer', 0)
        );

        return response()->json([
            'blessing_skin' => config('app.version'),
            'spec' => 0,
            'copyright' => $copyright,
            'site_name' => option('site_name'),
        ]);
    }

    public function siteConfig()
    {
        $user = auth()->user();
        $locale = config('app.locale');

        return response()->json([
            'siteName' => option_localized('site_name'),
            'locale' => $locale,
            'version' => config('app.version'),
            'siteDescription' => option_localized('site_description'),
            'homePicUrl' => option('home_pic_url') ?: config('options.home_pic_url'),
            'copyrightPrefer' => (int) option('copyright_prefer_'.$locale),
            'copyrightText' => option('copyright_text_'.$locale),
            'transparentNavbar' => (bool) option('transparent_navbar'),
            'hideIntro' => (bool) option('hide_intro'),
            'fixedBg' => (bool) option('fixed_bg'),
            'extra' => [
                'turnstile' => option('turnstile_sitekey'),
                'nickname' => $user?->nickname,
                'uploaderExists' => $user !== null,
                'currentUid' => $user?->uid,
                'admin' => $user?->isAdmin() ?? false,
                'unverified' => $user !== null && !$user->verified,
                'badges' => [],
                'download' => (bool) option('allow_downloading_texture'),
                'report' => (int) option('reporter_reward_score'),
                'regs_per_ip' => option('regs_per_ip'),
                'register_with_player_name' => (bool) option('register_with_player_name'),
                'player' => (bool) option('register_with_player_name'),
            ],
        ]);
    }

    public function customCss()
    {
        $css = (string) option('custom_css');
        return response($css, 200)->header('Content-Type', 'text/css; charset=utf-8');
    }

    public function customJs()
    {
        $js = (string) option('custom_js');
        return response($js, 200)->header('Content-Type', 'application/javascript; charset=utf-8');
    }

    public function i18n($locale)
    {
        $supported = ['en', 'zh_CN', 'zh_TW'];
        if (!in_array($locale, $supported, true)) {
            return response()->json(['message' => 'Unsupported locale'], 400);
        }

        $previousLocale = app()->getLocale();

        try {
            app()->setLocale($locale);

            $translations = trans('front-end');

            $translations['index'] = trans('index');

            $user = trans('user');
            $translations['user'] = array_merge($user, $translations['user'] ?? []);

            $general = trans('general');
            $translations['general'] = array_merge($general, $translations['general'] ?? []);

            $admin = trans('admin');
            $translations['admin'] = array_merge($admin, $translations['admin'] ?? []);

            $options = trans('options');
            $translations['options'] = array_merge($options, $translations['options'] ?? []);

            $plugins = app(PluginManager::class)->getEnabledPlugins();
            foreach ($plugins as $plugin) {
                $translations[$plugin->name] = trans($plugin->namespace.'::front-end');
            }

            return response()->json($translations);
        } finally {
            app()->setLocale($previousLocale);
        }
    }
}
