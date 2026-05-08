# SPA Migration Review Report

> Architecture: React SPA (EdgeOne Pages CDN) + PHP/Laravel API Backend (CVM)
> Auth: OAuth2/Passport + PKCE
> Review Date: 2026-05-08 (Round 1), 2026-05-09 (Round 2)

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

---

---

# Round 2 Review (2026-05-09)

> Reviewer: OpenCode
> Scope: Full codebase re-review after Round 1 fixes

---

## Critical (3)

### R2-C1. OAuth Scope 不完整 — 管理员功能在 SPA 模式下全部不可用

**Location**: `resources/assets/src/auth/AuthService.ts:147-148`

`login()` 只请求了 5 个 scope：

```typescript
scope: 'User.Read Player.Read Player.ReadWrite Closet.Read Closet.ReadWrite',
```

但 `routes/api.php` 中大量端点需要额外 scope：

| 端点                                   | 所需 Scope                    |
| -------------------------------------- | ----------------------------- |
| `GET /api/user/notifications`          | `Notification.Read`           |
| `POST /api/admin/notifications`        | `Notification.ReadWrite`      |
| `GET /api/admin/users`                 | `UsersManagement.Read`        |
| `PUT /api/admin/users/{user}/*`        | `UsersManagement.ReadWrite`   |
| `GET /api/admin/players`               | `PlayersManagement.Read`      |
| `PUT /api/admin/players/{player}/*`    | `PlayersManagement.ReadWrite` |
| `GET /api/admin/closet/{user}`         | `ClosetManagement.Read`       |
| `POST/DELETE /api/admin/closet/{user}` | `ClosetManagement.ReadWrite`  |
| `GET /api/admin/reports`               | `ReportsManagement.Read`      |
| `PUT /api/admin/reports/{report}`      | `ReportsManagement.ReadWrite` |

Passport 的 `CheckForAnyScope` 中间件（`Kernel.php:69`）对 OAuth 认证的请求**会检查 scope**。管理员通过 SPA OAuth 登录后，访问以上所有端点都会收到 403。

**Fix**: 在 `login()` 中请求所有 scope：

```typescript
scope: [
  'User.Read',
  'Notification.Read', 'Notification.ReadWrite',
  'Player.Read', 'Player.ReadWrite',
  'Closet.Read', 'Closet.ReadWrite',
  'UsersManagement.Read', 'UsersManagement.ReadWrite',
  'PlayersManagement.Read', 'PlayersManagement.ReadWrite',
  'ClosetManagement.Read', 'ClosetManagement.ReadWrite',
  'ReportsManagement.Read', 'ReportsManagement.ReadWrite',
].join(' '),
```

- [x] Fixed

---

### R2-C2. API 登录/注册端点在无状态环境下会抛异常

**Location**: `app/Http/Controllers/AuthController.php:98-107`, `routes/api.php:13-19`

`POST /api/auth/login` 调用 `Auth::login()` 创建 session，并调用 `$request->session()->pull(...)`。但 `api` 中间件组（`Kernel.php:42-44`）不包含 `StartSession`，在无 session 环境下这些调用会抛出异常。

```php
// AuthController.php:98 — session 操作在 API 中间件下会失败
Session::forget('login_fails');
// AuthController.php:101
Auth::login($user, $request->input('keep'));
// AuthController.php:107
$request->session()->pull('last_requested_path', '/user');
```

同样的问题存在于：

- `handleRegister()` (line 227): `Auth::login($user)` — session 依赖
- `captcha()` (line 326-335): `session(['captcha' => ...])` — session 依赖

SPA 模式下这些端点不被使用（SPA 走 OAuth PKCE），但它们暴露在 API 路由中，任何调用者都会遇到 500 错误。

**Fix**: 为这些方法添加 `$request->expectsJson()` 检查以跳过 session 操作，或从 `routes/api.php` 中移除这些端点。

- [x] Fixed

---

### R2-C3. NotificationsController::read() 空指针异常

**Location**: `app/Http/Controllers/NotificationsController.php:66`

```php
$notification = $request->user()->unreadNotifications->first(/* ... */);
$notification->markAsRead();  // $notification 可能为 null
```

当 `$id` 不匹配任何未读通知时（已读、不存在、或属于其他用户），`$notification` 为 `null`，调用 `markAsRead()` 导致 500 错误。

**Fix**:

```php
$notification = $request->user()->unreadNotifications->first(/* ... */);
if (!$notification) {
    return response()->json(['message' => 'Notification not found'], 404);
}
$notification->markAsRead();
```

当 `$id` 不匹配任何未读通知时（已读、不存在、或属于其他用户），`$notification` 为 `null`，调用 `markAsRead()` 导致 500 错误。

**Fix**:

```php
$notification = $request->user()->unreadNotifications->first(/* ... */);
if (!$notification) {
    return response()->json(['message' => 'Notification not found'], 404);
}
$notification->markAsRead();
```

- [x] Fixed

---

## High (5)

### R2-H1. Edge Function 未对代理响应添加 CORS 头

**Location**: `edge-functions/api-proxy.js:96-100`

`OPTIONS` 预检请求正确返回了 CORS 头（第 46-59 行），但实际的代理响应直接透传后端的 headers，**未注入** `Access-Control-Allow-Origin`。如果后端 Laravel CORS 配置的 `allowed_origins` 不包含 EdgeOne 域名，浏览器会拒绝响应。

```js
// line 96-100 — 缺少 CORS 头
return new Response(response.body, {
  status: response.status,
  statusText: response.statusText,
  headers: response.headers, // 直接透传，无 CORS 注入
})
```

**Fix**: 在代理响应中注入 CORS 头：

```js
const respHeaders = new Headers(response.headers)
respHeaders.set(
  'Access-Control-Allow-Origin',
  getCorsOrigin(request.headers.get('Origin'), env),
)
return new Response(response.body, {
  status: response.status,
  statusText: response.statusText,
  headers: respHeaders,
})
```

- [x] Fixed

---

### R2-H2. 登录端点缺少独立速率限制

**Location**: `app/Providers/RouteServiceProvider.php:68`, `routes/api.php:13-19`

`POST /api/auth/login` 使用全局 `throttle:60,1`（60 次/分钟），与所有其他 API 端点相同。认证端点应有更严格的限制以防暴力破解。

`AuthController` 内部有基于 IP 的 `login_fails` 计数器，但它依赖 session（见 R2-C2），在 API 中间件下不可用。

**Fix**: 为认证端点添加独立的速率限制：

```php
// routes/api.php
Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('login', 'AuthController@handleLogin');
    Route::post('register', 'AuthController@handleRegister');
    // ...
});
```

- [x] Fixed

---

### R2-H3. `AuthController::fillEmail()` 和 `handleVerify()` 缺少 JSON 响应

**Location**: `app/Http/Controllers/AuthController.php:344, 365-371`

`fillEmail()` 只返回 `redirect('/user')`，`handleVerify()` 只返回 `back()->with(...)` 或 `redirect()->route(...)`。通过 API 调用时返回 302 而非 JSON。

```php
// fillEmail() line 344
return redirect('/user');

// handleVerify() line 365-371
return back()->with('msg', trans('auth.verify.invalid'));
return redirect()->route('user.home');
```

**Fix**: 添加 `$request->expectsJson()` 检查：

```php
if ($request->expectsJson()) {
    return response()->json(['message' => trans('auth.verify.verified')]);
}
return redirect()->route('user.home');
```

- [x] Fixed

---

### R2-H4. `AdminController::statusData()` 泄露数据库凭据

**Location**: `app/Http/Controllers/AdminController.php:194`

响应中包含数据库 `username`、`host`、`port`、`database`、`prefix` 以及 `config('app.debug')` 状态。虽然是管理员端点，但 OAuth token 泄露后攻击面显著扩大。

```php
'username' => Arr::get($db, 'username'),  // 数据库用户名
'host' => Arr::get($db, 'host'),          // 数据库主机
'port' => Arr::get($db, 'port'),          // 数据库端口
```

**Fix**: 对敏感字段做脱敏处理：

```php
'username' => Str::mask(Arr::get($db, 'username', ''), '*', 2),
'host' => Arr::get($db, 'host') === '127.0.0.1' ? 'localhost' : '***',
```

或仅在 `config('app.debug')` 为 true 时返回完整信息。

- [x] Fixed

---

### R2-H5. `AuthController::logout()` 未撤销 OAuth Token

**Location**: `app/Http/Controllers/AuthController.php:125`

```php
Auth::logout();
```

`Auth::logout()` 只清除 session，不会使 OAuth access/refresh token 失效。SPA 端的 `AuthService.logout()` 调用了 `POST /api/auth/logout`，但服务端未撤销 token。已泄露的 token 在过期前仍可使用。

**Fix**:

```php
public function logout(Request $request)
{
    // Revoke OAuth token if present
    if ($request->bearerToken() && $request->user()) {
        $request->user()->token()->revoke();
    }
    Auth::logout();
    // ...
}
```

- [x] Fixed

---

## Medium (7)

### R2-M1. `dist/` 未加入 `.gitignore`

**Location**: `.gitignore`

`dist/` 是 SPA 构建产物目录，当前显示为 untracked（`?? dist/`）。应加入 `.gitignore` 防止误提交。

**Fix**: 在 `.gitignore` 中添加：

```
dist/
```

- [x] Fixed

---

### R2-M2. `blessing.base_url` 启动时序竞争

**Location**: `resources/assets/src/index.tsx:21-27`, `resources/assets/src/scripts/app.ts`

`scripts/app.ts` 在 `config.json` fetch 完成前就被导入执行。依赖 `blessing.base_url` 的模块（如 `scripts/i18n.ts:13`、`scripts/net.ts:33`、`components/Captcha.tsx:80`）在首次调用时可能读到空值。

当前通过延迟调用（`loadI18n` 在 `AppConfigProvider` 中调用）缓解了部分问题，但如果任何模块在 `config.json` 加载完成前发起 API 请求，URL 会指向错误地址。

```typescript
// index.tsx:21 — fetch 是异步的
fetch('/config.json')
  .then((r) => r.json())
  .then((cfg) => {
    window.blessing.base_url = cfg.apiBase || '' // 设置时机不确定
  })
```

**Fix**: 将 `config.json` 的加载提升为阻塞操作，在 React 渲染前完成；或将 `blessing.base_url` 的所有消费方改为从 React Context 中读取。

- [x] Fixed

---

### R2-M3. Sidebar 未根据用户权限过滤菜单项

**Location**: `resources/assets/src/layouts/Sidebar.tsx`

非管理员用户手动导航到 `/admin` 时会看到完整的管理菜单（API 会拒绝请求，但 UX 不佳）。`AdminRoute` guard 会阻止渲染页面内容，但 Sidebar 在 `MainLayout` 中独立渲染，不受 guard 控制。

**Fix**: 在 Sidebar 中检查 `user.admin` 和 `user.permission`，仅对有权限的用户显示管理菜单项。

- [x] Fixed

---

### R2-M4. Header 中硬编码英文字符串

**Location**: `resources/assets/src/layouts/Header.tsx:31-52`

"Dashboard"、"Profile"、"Logout"、"Login"、"User" 等字符串硬编码为英文，未使用 `t()` 国际化函数。与项目其他部分的 i18n 实践不一致。

**Fix**: 使用 `t()` 替换硬编码字符串：

```tsx
<a href="/user">{t('general.dashboard')}</a>
<a href="/user/profile">{t('general.profile')}</a>
<button onClick={handleLogout}>{t('general.logout')}</button>
```

- [x] Fixed

---

### R2-M5. `HomeController::i18n()` 未验证 locale 参数

**Location**: `app/Http/Controllers/HomeController.php:74`

`$locale` 参数直接从 URL `{locale}` 取值，未验证是否在支持的语言列表中。`app()->setLocale()` 会接受任意字符串，可能导致翻译文件查找异常路径。

**Fix**: 验证 locale 是否在允许列表中：

```php
$supported = ['en', 'zh_CN', 'zh_TW', /* ... */];
if (!in_array($locale, $supported)) {
    return response()->json(['message' => 'Unsupported locale'], 400);
}
```

- [x] Fixed

---

### R2-M6. `Api\OptionsController` 输入验证不完整

**Location**: `app/Http/Controllers/Api/OptionsController.php`

1. **`saveCustomize()` line 79-84**: `navbar` 和 `sidebar` 颜色值未验证是否在 `customize()` 方法定义的允许列表中（line 26-36）。管理员可设置任意字符串值。

2. **`saveScore()` line 145-148**: 如果只提交 `sign_score_from` 而不提交 `sign_score_to`（或反之），生成的 `sign_score` option 值会畸形（如 `"5,"` 或 `",10"`）。`UserController@sign` 中 `explode(',', option('sign_score'))` 传给 `rand()` 时可能产生非预期行为。

**Fix**:

```php
// saveCustomize()
'navbar' => 'in:primary,secondary,info,warning,danger,...',
'sidebar' => 'in:primary,secondary,...',

// saveScore()
'sign_score_from' => 'required_with:sign_score_to|integer|min:0',
'sign_score_to' => 'required_with:sign_score_from|integer|gte:sign_score_from',
```

- [x] Fixed

---

### R2-M7. Token 刷新逻辑存在两套独立实现

**Location**:

- `resources/assets/src/auth/AuthService.ts:23-62` — `refreshAccessToken()` + `apiFetch()`
- `resources/assets/src/scripts/net.ts:61-104` — `refreshAccessToken()` + `walkFetch()`

两套实现各自维护 `isRefreshing` / `refreshPromise` 状态，存在以下风险：

1. 两处同时触发刷新时，可能发送两次 refresh token 请求
2. 一处刷新成功后另一处不感知，仍使用旧 token
3. 维护成本高，修改一处容易遗漏另一处

**Fix**: 将 token 刷新逻辑抽取到 `tokenStore.ts` 或单独模块中，`AuthService.ts` 和 `net.ts` 共用同一实例。

- [x] Fixed

---

## Low (5)

### R2-L1. `emailVerification.tsx` 在 SPA 模式下重复挂载

**Location**: `resources/assets/src/scripts/emailVerification.tsx:12-14`

文件底部有一段在 import 时立即执行的 DOM 挂载逻辑，与 `tryRenderEmailVerification()`（SPA 兼容版本）功能重复。在 SPA 模式下，DOM 元素 `#email-verification` 不存在，虽然静默失败但属于不必要的副作用。

**Fix**: 移除文件底部的自动执行代码，仅保留 `tryRenderEmailVerification()` 导出函数。

- [x] Fixed

---

### R2-L2. AdminLTE jQuery 组件可能在 React 重渲染后失效

**Location**: `resources/assets/src/layouts/Sidebar.tsx`

Sidebar 使用 `data-widget="treeview"` 和 `data-widget="pushmenu"` 属性，依赖 AdminLTE 的 jQuery 插件在 DOM ready 时初始化。React 重渲染后这些 jQuery 事件绑定可能丢失，导致菜单折叠/展开功能失效。

**Fix**: 在 React `useEffect` 中手动初始化 AdminLTE 组件，或用纯 React 状态管理替代 jQuery 组件。

- [x] Fixed

---

### R2-L3. Webpack `scriptLoading: 'blocking'` 可改为 `'defer'`

**Location**: `webpack.config.ts:76`

```typescript
scriptLoading: 'blocking',
```

`blocking` 会阻塞 HTML 解析。对于 SPA（页面内容完全由 JS 渲染），功能上无差异，但 `'defer'` 可略微改善首屏感知速度。

**Fix**: 改为 `scriptLoading: 'defer'`。

- [x] Fixed

---

### R2-L4. `net.ts` 中 trace 信息的 HTML 转义逻辑矛盾

**Location**: `resources/assets/src/scripts/net.ts:196-198`

```typescript
message = `${escapeHtml(message)}<br><details>${escapeHtml(trace)}</details>`
```

`trace` 变量中包含 `<br>` 分隔符（line 195），但随后整个 `trace` 被 `escapeHtml()` 处理，`<br>` 也会被转义为 `&lt;br&gt;`，导致换行不生效。

**Fix**: 对 trace 中的每一行单独转义，再用 `<br>` 连接：

```typescript
const trace = body.trace
  .map((t, i) => `[${i + 1}] ${escapeHtml(t.file)}#L${t.line}`)
  .join('<br>')
message = `${escapeHtml(message)}<br><details>${trace}</details>`
```

- [x] Fixed

---

### R2-L5. 全局 `window.blessing` 遗留模式（技术债务）

**Location**: 多处文件

以下模块仍依赖全局 `window.blessing` 对象：

| 文件                             | 用途                                       |
| -------------------------------- | ------------------------------------------ |
| `scripts/net.ts:33`              | `blessing.base_url` 作为 API base fallback |
| `scripts/i18n.ts:13`             | `blessing.base_url` 构造翻译 API URL       |
| `scripts/logout.ts:17`           | `blessing.base_url` 构造登出跳转 URL       |
| `scripts/hooks/useTexture.ts:19` | `blessing.base_url` 构造材质 URL           |
| `components/Captcha.tsx:80`      | `blessing.base_url` 构造验证码图片 URL     |
| `scripts/extra.ts:5`             | 读取 `#blessing-extra` DOM 元素            |
| `scripts/net.ts:41-45`           | fallback 到 CSRF meta tag                  |

这些是为了兼容单体模式而保留的。在纯 SPA 部署中，这些 fallback 路径不会被触发，但增加了代码复杂度和维护成本。

**Fix**: 长期目标是将所有 `blessing.*` 全局引用迁移到 React Context（`AppConfig`），并在确认不再需要单体模式后移除 fallback 代码。

- [x] Fixed

---

## Architecture Suggestions (4)

### R2-A1. 考虑移除或隔离 `POST /api/auth/{login,register,forgot,reset}` 端点

SPA 使用 OAuth PKCE 流程认证，不使用这些端点。它们在 API 中间件下存在 session 依赖问题（R2-C2），且暴露了不必要的攻击面。

**建议**:

- **方案 A**: 从 `routes/api.php` 中移除这些端点，仅保留 `web.php` 中的版本
- **方案 B**: 如果需要为第三方客户端保留，添加 `$request->expectsJson()` 检查跳过所有 session 操作，并返回纯 JSON 响应

---

### R2-A2. 生产环境 CORS 不应默认 `*`

**Location**: `config/cors.php:6`

```php
'allowed_origins' => array_filter(explode(',', env('CORS_ALLOWED_ORIGINS', '*'))),
```

默认值 `*` 允许任意域名跨域访问 API。虽然 `.env.spa.example` 中已记录此变量，但默认值过于宽松。

**建议**: 将默认值改为空数组，强制运维人员显式配置：

```php
'allowed_origins' => env('CORS_ALLOWED_ORIGINS')
    ? array_filter(explode(',', env('CORS_ALLOWED_ORIGINS')))
    : [],
```

---

### R2-A3. Passport 公共客户端创建流程应自动化

当前 Passport 公共客户端需要手动执行 `php artisan passport:client --public`，然后将生成的 `client_id` 配置到 `REACT_APP_OAUTH_CLIENT_ID`。

**建议**: 创建一个 Artisan command 或 database seeder 自动创建 SPA 公共客户端：

```php
// database/seeders/PassportClientSeeder.php
Artisan::call('passport:client', [
    '--public' => true,
    '--name' => 'Blessing Skin SPA',
    '--redirect_uri' => config('app.url') . '/auth/callback',
]);
```

或在 `setup` 流程中自动执行。

---

### R2-A4. `UserController::user()` 通过 OAuth 暴露用户 email

**Location**: `app/Http/Controllers/UserController.php:23-30`

`user()` 方法通过 `makeHidden` 隐藏了 `password`、`ip`、`remember_token`、`verification_token`，但 **未隐藏 `email`**。对于仅持有 `User.Read` scope 的第三方 OAuth 应用，用户 email 会被暴露。

**建议**: 根据 OAuth scope 动态控制返回字段：

```php
$hidden = ['password', 'ip', 'remember_token', 'verification_token'];
if ($request->bearerToken() && !$request->user()->tokenCan('User.ReadEmail')) {
    $hidden[] = 'email';
}
return $user->makeHidden($hidden);
```

或添加 `User.ReadEmail` scope 来细粒度控制。

---

## Round 2 Summary

| Severity  | Count  | Key Areas                                                           |
| --------- | ------ | ------------------------------------------------------------------- |
| Critical  | 3      | OAuth scope 缺失、API session 依赖、空指针异常                      |
| High      | 5      | Edge Function CORS、速率限制、JSON 响应缺失、凭据泄露、Token 未撤销 |
| Medium    | 7      | gitignore、启动竞争、权限过滤、i18n、输入验证、Token 刷新重复       |
| Low       | 5      | 重复挂载、jQuery 兼容、webpack 优化、HTML 转义、遗留全局变量        |
| Arch      | 4      | API 端点清理、CORS 默认值、Passport 自动化、email 隐私              |
| **Total** | **24** |                                                                     |

## Round 2 Recommended Fix Order

1. **阻断性问题**: R2-C1 (OAuth scope) — 不修复则管理员功能完全不可用
2. **安全**: R2-H1 (Edge CORS) + R2-H2 (速率限制) + R2-H4 (凭据泄露) + R2-H5 (Token 撤销)
3. **健壮性**: R2-C2 (session 依赖) + R2-C3 (空指针) + R2-H3 (JSON 响应)
4. **质量**: R2-M1~M7 + R2-L1~L5
5. **架构**: R2-A1~A4（可纳入后续迭代）
