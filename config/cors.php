<?php

return [
    'paths' => ['api/*', 'oauth/*', 'auth/*', 'textures/*', 'avatar/*', 'preview/*', 'raw/*', 'csl/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => env('CORS_ALLOWED_ORIGINS')
        ? array_filter(explode(',', env('CORS_ALLOWED_ORIGINS')))
        : [],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 86400,
    'supports_credentials' => false,
];
