<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class FixSpaAssetPaths extends Migration
{
    /**
     * SPA 部署时站点根目录是 public/app/，旧默认路径已失效。
     * 仅修正恰好等于旧默认值的记录，用户自定义的值不受影响。
     */
    public function up()
    {
        DB::table('options')
            ->where('option_name', 'home_pic_url')
            ->where('option_value', './app/bg.webp')
            ->update(['option_value' => './bg.webp']);

        DB::table('options')
            ->where('option_name', 'favicon_url')
            ->where('option_value', 'app/favicon.ico')
            ->update(['option_value' => 'favicon.ico']);
    }

    public function down()
    {
        DB::table('options')
            ->where('option_name', 'home_pic_url')
            ->where('option_value', './bg.webp')
            ->update(['option_value' => './app/bg.webp']);

        DB::table('options')
            ->where('option_name', 'favicon_url')
            ->where('option_value', 'favicon.ico')
            ->update(['option_value' => 'app/favicon.ico']);
    }
}
