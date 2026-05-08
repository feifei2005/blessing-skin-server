# SPA Migration Review Report

> Architecture: React SPA (EdgeOne Pages CDN) + PHP/Laravel API Backend (CVM)
> Auth: OAuth2/Passport + PKCE
> Review Date: 2026-05-08

---

## Critical (5)

### C1. Banned users can bypass restrictions via API

**Location**: `app/Http/Kernel.php:46-51`, `routes/api.php`

The `authorize` middleware group includes `RejectBannedUser`, but all API routes only use bare `auth:web,oauth` without `RejectBannedUser`. A banned user holding a valid OAuth token can still call all API mutation endpoints.

```php
// Kernel.php - authorize group (used by web routes)
'authorize' => [
    'auth:web,oauth',
    Middleware\RejectBannedUser::class,      // <-- missing from API routes
    Middleware\EnsureEmailFilled::class,      // <-- missing from API routes
    Middleware\FireUserAuthenticated::class,  // <-- missing from API routes
],
```

**Fix**: Add `RejectBannedUser` middleware to API route groups in `routes/api.php`:

```php
Route::prefix('user')
    ->middleware(['auth:web,oauth', RejectBannedUser::class])
    ->group(function () { ... });
```

- [x] Fixed

---

### C2. Server does not enforce PKCE for public clients

**Location**: `app/Providers/AuthServiceProvider.php:24-61`

Missing `Passport::requireCodeChallengeForPublicClients()`. The client-side correctly implements PKCE (`auth/pkce.ts`), but the server does not mandate it. An attacker who intercepts an authorization code could exchange it without a code verifier.

**Fix**: Add to `AuthServiceProvider::boot()`:

```php
Passport::requireCodeChallengeForPublicClients();
```

- [x] Fixed

---

### C3. `NotificationsController@send` returns redirect instead of JSON

**Location**: `app/Http/Controllers/NotificationsController.php:41-43`

```php
session(['sentResult' => trans('admin.notifications.send.success')]);
return redirect('/admin');
```

The API route `POST /api/admin/notifications` (`routes/api.php:123`) calls the same `send()` method. The SPA will receive a 302 redirect response instead of a JSON response.

**Fix**: Return JSON when the request expects it:

```php
if ($request->expectsJson()) {
    return response()->json(['message' => trans('admin.notifications.send.success')]);
}
return redirect('/admin');
```

- [x] Fixed

---

### C4. `blessing.extra` race condition — Captcha and email verification broken

**Location**:

- `resources/assets/src/components/Captcha.tsx:26-27`
- `resources/assets/src/scripts/emailVerification.tsx:7`
- `resources/assets/src/contexts/AppConfig.tsx:75-78`

`Captcha.tsx` reads `blessing.extra.recaptcha` at constructor time. `emailVerification.tsx` reads `blessing.extra.unverified` at module load time. Both execute **before** `AppConfigProvider` asynchronously fetches `/api/site-config` and populates `blessing.extra`.

Result: reCAPTCHA never renders; email verification prompt never shows.

**Fix**: Refactor `Captcha` and `emailVerification` to consume `blessing.extra` reactively (via React context or state) instead of reading it synchronously at load/construct time.

- [x] Fixed

---

### C5. Edge Function CORS reflects any Origin

**Location**: `edge-functions/api-proxy.js:32,74`

```js
'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
```

This reflects any `Origin` header back, allowing any website to make cross-origin API calls through the proxy.

**Fix**: Configure an allowed origin whitelist via environment variable:

```js
const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',')
const origin = request.headers.get('Origin')
const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
```

- [x] Fixed

---

## High (8)

### H1. Auth POST endpoints missing from API routes

**Location**: `routes/api.php` (missing), `routes/web.php:21-35`

The following web route POST operations return JSON but have no API route equivalents:

- `POST /auth/login` — Login
- `POST /auth/register` — Registration
- `POST /auth/forgot` — Forgot password
- `POST /auth/reset/{uid}` — Reset password
- `POST /auth/logout` — Logout

The SPA bypasses direct login via OAuth, but registration, forgot password, and reset password still need these endpoints. They go through the `web` middleware group (requiring CSRF token). The SPA calls with `credentials: 'omit'` and will fail due to missing CSRF token.

**Fix**: Create corresponding API routes under `/api/auth/` without CSRF middleware, or add these to the `api` middleware group.

- [x] Fixed

---

### H2. `AuthService.ts` has no token refresh logic

**Location**: `resources/assets/src/auth/AuthService.ts:49-61`

`fetchUser()` clears all tokens (including the refresh token) on any non-OK response, instead of attempting a refresh. When a user returns to the app after access token expiry but with a valid refresh token, they are unnecessarily logged out.

Compare with `scripts/net.ts:52-98` which has full refresh logic with race condition protection, but `AuthService.ts` is completely independent and does not reuse it.

**Fix**: Have `AuthService.ts` use `net.ts`'s `walkFetch`, or add refresh logic to `apiFetch`.

- [x] Fixed

---

### H3. 401 response does not redirect to login page

**Location**: `resources/assets/src/scripts/net.ts:170-175`

After token refresh failure, the code clears the token and shows a modal alert, but the user remains on the current page in an invalid state. No redirect to `/auth/login` occurs.

```ts
clearToken()
return showModal({
  mode: 'alert',
  text: message || t('general.fatalError'),
  type: 'warning',
})
```

**Fix**: After clearing the token and showing the modal, redirect to `/auth/login`:

```ts
window.location.href = '/auth/login'
```

Or use React Router's history to navigate programmatically.

- [x] Fixed

---

### H4. Missing Passport migration and key configuration documentation

**Location**: Project root (no documentation exists)

No documentation explains how to:

1. Run Passport database migrations (`php artisan migrate`)
2. Generate Passport RSA keys (`php artisan passport:keys`)
3. Create a public client (`php artisan passport:client --public`)
4. Configure `REACT_APP_OAUTH_CLIENT_ID` with the generated client ID

Existing deployments upgrading to the SPA architecture will have no guidance.

**Fix**: Add a deployment guide covering these steps.

- [x] Fixed

---

### H5. No health check endpoint

**Location**: `routes/api.php`

No `/api/health` or similar unauthenticated endpoint exists. The existing `/api/admin/status` requires admin authentication (`routes/api.php:80`), making it unusable for Docker/K8s health checks or load balancer probes.

**Fix**: Add an unauthenticated health check:

```php
Route::get('health', fn() => response()->json(['status' => 'ok', 'timestamp' => now()]));
```

- [x] Fixed

---

### H6. `EnsureEmailFilled` missing from API routes

**Location**: `app/Http/Kernel.php:49`, `routes/api.php`

Web routes enforce email binding via the `authorize` middleware group, but API routes skip `EnsureEmailFilled` entirely. A user who hasn't filled their email can access all API endpoints.

**Fix**: Add `EnsureEmailFilled` to authenticated API route groups, or create an API-compatible version that returns 403 JSON instead of a redirect.

- [x] Fixed

---

### H7. `/auth/logout` not proxied by Edge Function

**Location**: `edge-functions/api-proxy.js:5-20`

`/auth/logout` is not in the `PROXIED_PATHS` array. The SPA's `AuthService.ts:140-142` only clears local tokens without hitting the backend, meaning OAuth refresh tokens are never revoked on logout.

**Fix**: Add `/auth/logout` to `PROXIED_PATHS` and implement server-side token revocation in the logout flow.

- [x] Fixed

---

### H8. CORS `allowed_origins` defaults to `*`

**Location**: `config/cors.php:6`

```php
'allowed_origins' => array_filter(explode(',', env('CORS_ALLOWED_ORIGINS', '*'))),
```

If `CORS_ALLOWED_ORIGINS` is not set in `.env`, all origins are allowed. `.env.spa.example` does not document this variable, so operators may forget to set it.

**Fix**: Document `CORS_ALLOWED_ORIGINS` in `.env.spa.example` and `.env.example`. Consider removing the `*` default.

- [x] Fixed

---

## Medium (8)

### M1. SPA production deployment missing fallback configuration

**Location**: `Dockerfile.spa`

The Dockerfile produces static files but includes no `_redirects` file, `200.html`, or nginx config for client-side routing. Direct URL access to any route other than `/` (e.g., `/user/closet`) will 404 in production on most CDN/static hosting platforms.

**Fix**: Add a `_redirects` file (`/* /index.html 200`) or configure EdgeOne Pages fallback routing.

- [x] Fixed

---

### M2. API base URL only configurable at build time

**Location**: `webpack.config.ts:87-89`

```js
'process.env.REACT_APP_API_BASE': JSON.stringify(process.env.REACT_APP_API_BASE || '')
```

The API base URL is compiled into the JavaScript bundle via `DefinePlugin`. Changing the backend address requires rebuilding the Docker image. No runtime configuration mechanism exists.

**Fix**: Implement runtime config injection (e.g., serve a `/config.json` that the SPA reads before bootstrapping, or use the edge function to rewrite a placeholder in the built JS).

- [x] Fixed

---

### M3. `Dockerfile.spa` missing `ARG` directives

**Location**: `Dockerfile.spa:22-23`

Uses `ENV` with empty strings but no `ARG`, so values cannot be passed via `--build-arg`.

**Fix**:

```dockerfile
ARG REACT_APP_API_BASE=""
ARG REACT_APP_OAUTH_CLIENT_ID=""
ENV REACT_APP_API_BASE=$REACT_APP_API_BASE
ENV REACT_APP_OAUTH_CLIENT_ID=$REACT_APP_OAUTH_CLIENT_ID
```

- [x] Fixed

---

### M4. `.env.spa.example` missing critical variables

**Location**: `.env.spa.example`

Only 2 variables defined. Missing:

- `CORS_ALLOWED_ORIGINS` — required for API backend
- `API_BASE_URL` — EdgeOne edge function environment variable
- Passport-related variables

**Fix**: Add all required variables with comments.

- [x] Fixed

---

### M5. CI workflows not updated for SPA architecture

**Location**: `.github/workflows/CI.yml`, `.github/workflows/Release.yml`

Both workflows only build the monolithic application. Missing:

- SPA build verification (`docker build -f Dockerfile.spa .`)
- SPA artifact upload
- Docker image build and push for `Dockerfile.spa`
- Edge function validation

**Fix**: Add CI jobs for SPA build, Docker image push, and integration testing.

- [x] Fixed

---

### M6. Hard navigations break SPA state

**Location**:

- `resources/assets/src/views/auth/Registration.tsx:68` — `window.location.href = blessing.base_url/user`
- `resources/assets/src/views/auth/Reset.tsx:44` — `window.location.href = blessing.base_url + urls.auth.login()`
- `resources/assets/src/views/auth/Forgot.tsx:56` — `<a href>` instead of `<Link>`
- `resources/assets/src/views/auth/Registration.tsx:162` — `<a href>` instead of `<Link>`
- `resources/assets/src/scripts/logout.ts:17` — `window.location.href = blessing.base_url`

These cause full page reloads, destroying React state and requiring re-authentication.

**Fix**: Replace `window.location.href` with React Router's `useHistory().push()` and `<a href>` with `<Link>`.

- [x] Fixed

---

### M7. Logout does not revoke server-side tokens

**Location**: `resources/assets/src/auth/AuthService.ts:140-143`

```ts
logout() {
  clearToken()
  window.location.href = `${this.apiBase}/auth/login`
}
```

Only clears local tokens. Does not call the server to revoke access/refresh tokens. Exfiltrated tokens remain valid until expiry.

**Fix**: POST to a token revocation endpoint before clearing local tokens.

- [x] Fixed

---

### M8. Edge Function placeholder URL fails silently

**Location**: `edge-functions/api-proxy.js:25`

```js
const apiBase = env.API_BASE_URL || 'https://your-cvm-server.com'
```

If `API_BASE_URL` is not configured, requests silently proxy to a non-existent domain instead of failing loudly.

**Fix**: Throw an error or return 503 if `API_BASE_URL` is not set:

```js
const apiBase = env.API_BASE_URL
if (!apiBase) {
  return new Response('API_BASE_URL not configured', { status: 503 })
}
```

- [x] Fixed

---

## Low (7)

### L1. `dangerousHTML` renders server error messages — potential XSS

**Location**: `resources/assets/src/scripts/net.ts:184-197`

Server error responses with `body.exception` and `body.trace` are concatenated into an HTML string and displayed via `dangerousHTML`. If an attacker can influence the server's error message (e.g., through crafted input that appears in an exception message), this could be an XSS vector.

```ts
message = `${message}<br><details>${trace}</details>`
// ...
dangerousHTML: error.message,
```

**Fix**: Sanitize or escape the error message before rendering, or use plain text display.

- [x] Fixed

---

### L2. `Dockerfile.spa` uses unpinned Node.js version

**Location**: `Dockerfile.spa:10`

```dockerfile
FROM node:alpine
```

No version pin. A Node.js major version bump could break the build.

**Fix**: Pin to a specific version, e.g., `FROM node:20-alpine`.

- [x] Fixed

---

### L3. Dead code in SPA mode

**Location**:

- `resources/assets/src/scripts/notification.tsx:5-7` — queries `[data-notifications]` element
- `resources/assets/src/scripts/darkMode.tsx:5-8` — queries `#toggle-dark-mode` element
- `resources/assets/src/scripts/logout.ts:20-22` — queries `#logout-button` element
- `resources/assets/src/scripts/extra.ts:2` — reads `#blessing-extra` DOM element

These query DOM elements that don't exist in the SPA template (`resources/assets/template.html`). They fail silently but are unnecessary dead weight.

**Fix**: Remove or gate these behind a check for SPA vs. server-rendered mode.

- [x] Fixed

---

### L4. `{player}.json` root-level route not proxied

**Location**: `routes/static.php:5`, `edge-functions/api-proxy.js:5-20`

The root-level route `/{player}.json` (e.g., `/Steve.json`) is not proxied by the edge function. This only matters for external Minecraft clients, not the SPA, but should be documented.

**Fix**: Document that Minecraft clients should hit the API backend directly, not through EdgeOne.

- [x] Fixed

---

### L5. Edge Function forwards all request headers including cookies

**Location**: `edge-functions/api-proxy.js:48-50`

```js
const response = await fetch(targetUrl, {
  method: request.method,
  headers: request.headers,  // forwards ALL headers including Cookie
```

While the SPA uses `credentials: 'omit'`, any direct request to the edge function with cookies would forward them to the backend.

**Fix**: Strip `Cookie` header from proxied requests, or explicitly construct a new `Headers` object with only the needed headers.

- [x] Fixed

---

### L6. Double CORS handling may cause conflicts

**Location**: `edge-functions/api-proxy.js:71-83`, `config/cors.php:4`

The edge function adds CORS headers to all proxied responses. Laravel's `HandleCors` middleware (`Kernel.php:42`) also adds CORS headers for `api/*` and `oauth/*` paths. Double CORS headers can cause browser errors.

**Fix**: Either remove CORS from the edge function (rely on Laravel) or remove `HandleCors` from the `api` middleware group (rely on edge function). The edge function approach is preferred since it covers all proxied paths.

- [x] Fixed

---

### L7. Dead `REACT_APP_OAUTH_CLIENT_SECRET` type declaration

**Location**: `webpack.d.ts:21`

Declares `REACT_APP_OAUTH_CLIENT_SECRET` in the type definitions, but this variable is never used, never set in any Dockerfile or `.env` file, and never injected by `webpack.config.ts`. The SPA uses PKCE (public client) and should not have a client secret.

**Fix**: Remove the type declaration.

- [x] Fixed

---

## Summary

| Severity  | Count  | Key Areas                                                                         |
| --------- | ------ | --------------------------------------------------------------------------------- |
| Critical  | 5      | Security (banned user bypass, PKCE), functionality (Captcha, notifications), CORS |
| High      | 8      | Missing auth API routes, token refresh, health check, documentation               |
| Medium    | 8      | Deployment config, CI, hard navigations, token revocation                         |
| Low       | 7      | XSS risk, dead code, Docker optimization, double CORS                             |
| **Total** | **28** |                                                                                   |

## Recommended Fix Order

1. **Security first**: C1 (banned user bypass) + C2 (PKCE enforcement) + C5 (CORS) + H8 (CORS default)
2. **Functionality**: C3 (notifications redirect) + C4 (Captcha/email verification) + H1 (auth API routes)
3. **Stability**: H2 (token refresh) + H3 (401 redirect) + M1 (SPA fallback)
4. **Operations**: H4 (documentation) + H5 (health check) + M4 (env variables) + M5 (CI)
