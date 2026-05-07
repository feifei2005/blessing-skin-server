<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class HandleCors
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->isMethod('OPTIONS')) {
            $origin = $request->header('Origin');
            $allowedOrigins = config('cors.allowed_origins', ['*']);

            if (in_array('*', $allowedOrigins) || in_array($origin, $allowedOrigins)) {
                return response('', 204)
                    ->header('Access-Control-Allow-Origin', $origin ?: '*')
                    ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
                    ->header('Access-Control-Allow-Credentials', 'true')
                    ->header('Access-Control-Max-Age', '86400');
            }
        }

        $response = $next($request);

        $allowedOrigins = config('cors.allowed_origins', ['*']);
        $origin = $request->header('Origin');

        if (in_array('*', $allowedOrigins) || in_array($origin, $allowedOrigins)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin ?: '*');
        }

        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Max-Age', '86400');

        return $response;
    }
}
