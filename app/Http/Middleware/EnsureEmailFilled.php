<?php

namespace App\Http\Middleware;

use Closure;

class EnsureEmailFilled
{
    public function handle($request, Closure $next)
    {
        if ($request->user()->email != '' && $request->is('auth/bind')) {
            if ($request->expectsJson()) {
                return response()->json(['message' => trans('auth.email-already-filled')], 403);
            }
            return redirect('/user');
        } elseif ($request->user()->email == '' && !$request->is('auth/bind')) {
            if ($request->expectsJson()) {
                return response()->json(['message' => trans('auth.email-required')], 403);
            }
            return redirect('/auth/bind');
        }

        return $next($request);
    }
}
