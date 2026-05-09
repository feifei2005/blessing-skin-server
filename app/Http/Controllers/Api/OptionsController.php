<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Facades\Option;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class OptionsController extends Controller
{
    public function customize()
    {
        return response()->json([
            'home_pic_url' => option('home_pic_url'),
            'favicon_url' => option('favicon_url'),
            'transparent_navbar' => (bool) option('transparent_navbar'),
            'hide_intro' => (bool) option('hide_intro'),
            'fixed_bg' => (bool) option('fixed_bg'),
            'copyright_prefer' => option('copyright_prefer_'.config('app.locale')),
            'copyright_text' => option('copyright_text_'.config('app.locale')),
            'custom_css' => option('custom_css'),
            'custom_js' => option('custom_js'),
            'colors' => [
                'navbar' => [
                    'primary', 'secondary', 'success', 'danger', 'indigo',
                    'purple', 'pink', 'teal', 'cyan', 'dark', 'gray',
                    'fuchsia', 'maroon', 'olive', 'navy',
                    'lime', 'light', 'warning', 'white', 'orange',
                ],
                'sidebar' => [
                    'primary', 'warning', 'info', 'danger', 'success', 'indigo',
                    'navy', 'purple', 'fuchsia', 'pink', 'maroon', 'orange',
                    'lime', 'teal', 'olive',
                ],
            ],
            'extra' => [
                'navbar' => option('navbar_color'),
                'sidebar' => option('sidebar_color'),
            ],
        ]);
    }

    public function saveCustomize(Request $request)
    {
        $request->validate([
            'home_pic_url' => 'nullable|url',
            'favicon_url' => 'nullable|url',
            'transparent_navbar' => 'nullable|boolean',
            'hide_intro' => 'nullable|boolean',
            'fixed_bg' => 'nullable|boolean',
            'copyright_prefer' => 'nullable|integer|min:0|max:6',
            'copyright_text' => 'nullable|string',
            'custom_css' => 'nullable|string',
            'custom_js' => 'nullable|string',
            'action' => 'nullable|string|in:color',
            'navbar' => 'nullable|string|in:primary,secondary,success,danger,indigo,purple,pink,teal,cyan,dark,gray,fuchsia,maroon,olive,navy,lime,light,warning,white,orange',
            'sidebar' => 'nullable|string|in:primary,warning,info,danger,success,indigo,navy,purple,fuchsia,pink,maroon,orange,lime,teal,olive',
        ]);
        $keys = [
            'home_pic_url', 'favicon_url', 'transparent_navbar', 'hide_intro',
            'fixed_bg', 'custom_css', 'custom_js',
        ];
        foreach ($keys as $key) {
            if ($request->has($key)) {
                Option::set($key, $request->input($key));
            }
        }

        if ($request->has('copyright_prefer')) {
            Option::set('copyright_prefer_'.config('app.locale'), $request->input('copyright_prefer'));
        }
        if ($request->has('copyright_text')) {
            Option::set('copyright_text_'.config('app.locale'), $request->input('copyright_text'));
        }

        if ($request->input('action') === 'color') {
            if ($request->input('navbar')) {
                Option::set('navbar_color', $request->input('navbar'));
            }
            if ($request->input('sidebar')) {
                Option::set('sidebar_color', $request->input('sidebar'));
            }
        }

        return json(trans('admin.options.changed'), 0);
    }

    public function score()
    {
        $signScore = explode(',', option('sign_score') ?? '');

        return response()->json([
            'score_per_storage' => (int) option('score_per_storage'),
            'private_score_per_storage' => (int) option('private_score_per_storage'),
            'score_per_closet_item' => (int) option('score_per_closet_item'),
            'return_score' => (bool) option('return_score'),
            'score_per_player' => (int) option('score_per_player'),
            'user_initial_score' => (int) option('user_initial_score'),
            'reporter_score_modification' => (int) option('reporter_score_modification'),
            'reporter_reward_score' => (int) option('reporter_reward_score'),
            'sign_score_from' => $signScore[0] ?? '',
            'sign_score_to' => $signScore[1] ?? '',
            'sign_gap_time' => (int) option('sign_gap_time'),
            'sign_after_zero' => (bool) option('sign_after_zero'),
            'score_award_per_texture' => (int) option('score_award_per_texture'),
            'take_back_scores_after_deletion' => (bool) option('take_back_scores_after_deletion'),
            'score_award_per_like' => (int) option('score_award_per_like'),
        ]);
    }

    public function saveScore(Request $request)
    {
        $request->validate([
            'score_per_storage' => 'nullable|integer|min:0',
            'private_score_per_storage' => 'nullable|integer|min:0',
            'score_per_closet_item' => 'nullable|integer|min:0',
            'return_score' => 'nullable|boolean',
            'score_per_player' => 'nullable|integer|min:0',
            'user_initial_score' => 'nullable|integer|min:0',
            'reporter_score_modification' => 'nullable|integer',
            'reporter_reward_score' => 'nullable|integer',
            'sign_score_from' => 'required_with:sign_score_to|nullable|integer|min:0',
            'sign_score_to' => 'required_with:sign_score_from|nullable|integer|gte:sign_score_from',
            'sign_gap_time' => 'nullable|integer|min:0',
            'sign_after_zero' => 'nullable|boolean',
            'score_award_per_texture' => 'nullable|integer|min:0',
            'take_back_scores_after_deletion' => 'nullable|boolean',
            'score_award_per_like' => 'nullable|integer|min:0',
        ]);
        $keys = [
            'score_per_storage', 'private_score_per_storage', 'score_per_closet_item',
            'return_score', 'score_per_player', 'user_initial_score',
            'reporter_score_modification', 'reporter_reward_score',
            'sign_gap_time', 'sign_after_zero',
            'score_award_per_texture', 'take_back_scores_after_deletion', 'score_award_per_like',
        ];
        foreach ($keys as $key) {
            if ($request->has($key)) {
                Option::set($key, $request->input($key));
            }
        }

        $signFrom = $request->input('sign_score_from');
        $signTo = $request->input('sign_score_to');
        if ($signFrom !== null || $signTo !== null) {
            Option::set('sign_score', $signFrom.','.$signTo);
        }

        return json(trans('admin.options.changed'), 0);
    }

    public function general()
    {
        return response()->json([
            'site_name' => option('site_name_'.config('app.locale')),
            'site_description' => option('site_description_'.config('app.locale')),
            'site_url' => option('site_url'),
            'register_with_player_name' => (bool) option('register_with_player_name'),
            'require_verification' => (bool) option('require_verification'),
            'regs_per_ip' => option('regs_per_ip'),
            'max_upload_file_size' => option('max_upload_file_size'),
            'max_texture_width' => option('max_texture_width'),
            'player_name_rule' => option('player_name_rule'),
            'custom_player_name_regexp' => option('custom_player_name_regexp'),
            'player_name_length_min' => option('player_name_length_min'),
            'player_name_length_max' => option('player_name_length_max'),
            'auto_del_invalid_texture' => (bool) option('auto_del_invalid_texture'),
            'allow_downloading_texture' => (bool) option('allow_downloading_texture'),
            'status_code_for_private' => option('status_code_for_private'),
            'texture_name_regexp' => option('texture_name_regexp'),
            'content_policy' => option('content_policy_'.config('app.locale')),
            'announcement' => option('announcement_'.config('app.locale')),
            'meta_keywords' => option('meta_keywords'),
            'meta_description' => option('meta_description'),
            'meta_extras' => option('meta_extras'),
            'turnstile_sitekey' => option('turnstile_sitekey'),
        ]);
    }

    public function saveGeneral(Request $request)
    {
        $request->validate([
            'site_name' => 'nullable|string',
            'site_description' => 'nullable|string',
            'site_url' => 'nullable|url',
            'register_with_player_name' => 'nullable|boolean',
            'require_verification' => 'nullable|boolean',
            'regs_per_ip' => 'nullable|integer|min:0',
            'max_upload_file_size' => 'nullable|integer|min:0',
            'max_texture_width' => 'nullable|integer|min:0',
            'player_name_rule' => 'nullable|string|in:official,cjk,utf8,custom',
            'custom_player_name_regexp' => 'nullable|string',
            'player_name_length_min' => 'nullable|integer|min:1',
            'player_name_length_max' => 'nullable|integer|min:1',
            'auto_del_invalid_texture' => 'nullable|boolean',
            'allow_downloading_texture' => 'nullable|boolean',
            'status_code_for_private' => 'nullable|string|in:403,404',
            'texture_name_regexp' => 'nullable|string',
            'content_policy' => 'nullable|string',
            'announcement' => 'nullable|string',
            'meta_keywords' => 'nullable|string',
            'meta_description' => 'nullable|string',
            'meta_extras' => 'nullable|string',
            'turnstile_sitekey' => 'nullable|string',
            'turnstile_secretkey' => 'nullable|string',
        ]);
        $keys = [
            'register_with_player_name', 'require_verification', 'regs_per_ip',
            'max_upload_file_size', 'max_texture_width', 'player_name_rule',
            'custom_player_name_regexp', 'player_name_length_min', 'player_name_length_max',
            'auto_del_invalid_texture', 'allow_downloading_texture',
            'status_code_for_private', 'texture_name_regexp',
            'meta_keywords', 'meta_description', 'meta_extras',
            'turnstile_sitekey',
        ];
        foreach ($keys as $key) {
            if ($request->has($key)) {
                Option::set($key, $request->input($key));
            }
        }

        // turnstile_secretkey: only update if a non-empty value is submitted
        if ($request->has('turnstile_secretkey') && $request->input('turnstile_secretkey') !== '') {
            Option::set('turnstile_secretkey', $request->input('turnstile_secretkey'));
        }

        // Locale-suffixed keys
        foreach (['site_name', 'site_description', 'content_policy', 'announcement'] as $key) {
            if ($request->has($key)) {
                Option::set($key.'_'.config('app.locale'), $request->input($key));
            }
        }

        // site_url: strip trailing / and /index.php
        if ($request->has('site_url')) {
            $url = $request->input('site_url');
            if (Str::endsWith($url, '/index.php')) {
                $url = substr($url, 0, -10);
            }
            if (Str::endsWith($url, '/')) {
                $url = substr($url, 0, -1);
            }
            Option::set('site_url', $url);
        }

        return json(trans('admin.options.changed'), 0);
    }

    public function resource()
    {
        return response()->json([
            'force_ssl' => (bool) option('force_ssl'),
            'auto_detect_asset_url' => (bool) option('auto_detect_asset_url'),
            'cache_expire_time' => option('cache_expire_time'),
            'cdn_address' => option('cdn_address'),
            'enable_avatar_cache' => (bool) option('enable_avatar_cache'),
            'enable_preview_cache' => (bool) option('enable_preview_cache'),
        ]);
    }

    public function saveResource(Request $request)
    {
        $request->validate([
            'force_ssl' => 'nullable|boolean',
            'auto_detect_asset_url' => 'nullable|boolean',
            'cache_expire_time' => 'nullable|integer|min:0',
            'cdn_address' => 'nullable|string',
            'enable_avatar_cache' => 'nullable|boolean',
            'enable_preview_cache' => 'nullable|boolean',
        ]);
        $keys = [
            'force_ssl', 'auto_detect_asset_url', 'cache_expire_time',
            'enable_avatar_cache', 'enable_preview_cache',
        ];
        foreach ($keys as $key) {
            if ($request->has($key)) {
                Option::set($key, $request->input($key));
            }
        }

        if ($request->has('cdn_address')) {
            $cdnAddress = $request->input('cdn_address');
            if ($cdnAddress === null) {
                $cdnAddress = '';
            }
            if (Str::endsWith($cdnAddress, '/')) {
                $cdnAddress = substr($cdnAddress, 0, -1);
            }
            Option::set('cdn_address', $cdnAddress);
        }

        return json(trans('admin.options.changed'), 0);
    }

    public function clearCache()
    {
        Cache::flush();

        return json(trans('options.cache.cleared'), 0);
    }
}
