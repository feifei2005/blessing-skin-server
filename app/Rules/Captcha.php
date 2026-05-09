<?php

namespace App\Rules;

use Blessing\Filter;
use Gregwar\Captcha\CaptchaBuilder;
use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Vectorface\Whip\Whip;

class Captcha implements Rule
{
    public function passes($attribute, $value)
    {
        $secretkey = option('turnstile_secretkey');
        if ($secretkey) {
            return Http::asForm()
                ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => $secretkey,
                    'response' => $value,
                ])
                ->json()['success'];
        }

        $phrase = session()->pull('captcha');
        if (!$phrase) {
            $whip = new Whip();
            $ip = $whip->getValidIpAddress();
            $ip = app(Filter::class)->apply('client_ip', $ip);
            $phrase = Cache::pull('captcha_' . $ip);
        }

        if (!$phrase) {
            return false;
        }

        $builder = new CaptchaBuilder($phrase);

        return $builder->testPhrase($value);
    }

    public function message()
    {
        return option('turnstile_secretkey')
            ? trans('validation.turnstile')
            : trans('validation.captcha');
    }
}
