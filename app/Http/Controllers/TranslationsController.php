<?php

namespace App\Http\Controllers;

use App\Services\Translations\JavaScript;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Spatie\TranslationLoader\LanguageLine;

class TranslationsController extends Controller
{
    public function list()
    {
        return LanguageLine::paginate(10);
    }

    public function create(Request $request, Application $app, JavaScript $js)
    {
        $data = $request->validate([
            'group' => 'required|string',
            'key' => 'required|string',
            'text' => 'required|string',
        ]);

        $line = new LanguageLine();
        $line->group = $data['group'];
        $line->key = $data['key'];
        $line->setTranslation($app->getLocale(), $data['text']);
        $line->save();

        if ($data['group'] === 'front-end') {
            $js->resetTime($app->getLocale());
        }

        // 统一返回 JSON，避免在无 session 的 API 上下文中崩溃
        return json(trans('admin.i18n.added'), 0, ['id' => $line->id]);
    }

    public function update(
        Request $request,
        Application $app,
        JavaScript $js,
        LanguageLine $line,
    ) {
        $data = $request->validate(['text' => 'required|string']);

        $line->setTranslation($app->getLocale(), $data['text']);
        $line->save();

        if ($line->group === 'front-end') {
            $js->resetTime($app->getLocale());
        }

        return json(trans('admin.i18n.updated'), 0);
    }

    public function delete(
        Application $app,
        JavaScript $js,
        LanguageLine $line,
    ) {
        $line->delete();

        if ($line->group === 'front-end') {
            $js->resetTime($app->getLocale());
        }

        return json(trans('admin.i18n.deleted'), 0);
    }
}
