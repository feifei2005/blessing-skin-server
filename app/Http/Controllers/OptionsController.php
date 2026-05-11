<?php

namespace App\Http\Controllers;

use App\Services\Facades\Option;
use App\Services\OptionForm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class OptionsController extends Controller
{
    public function customize(Request $request)
    {
        $spaUrl = env('SPA_URL', config('app.url'));
        return redirect($spaUrl . '/admin/customize', 302);
    }

    public function score()
    {
        $spaUrl = env('SPA_URL', config('app.url'));
        return redirect($spaUrl . '/admin/score', 302);
    }

    public function options()
    {
        $spaUrl = env('SPA_URL', config('app.url'));
        return redirect($spaUrl . '/admin/options', 302);
    }

    public function resource(Request $request)
    {
        $spaUrl = env('SPA_URL', config('app.url'));
        return redirect($spaUrl . '/admin/resource', 302);
    }
}
