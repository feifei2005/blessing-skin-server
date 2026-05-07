# Blessing Skin Server - SPA Migration Plan

> Generated: 2026-05-07
> Current Status: In Progress (all changes uncommitted on `dev` branch)
> Target Architecture: React SPA (EdgeOne Pages CDN) + PHP/Laravel API Backend (CVM)

---

## Architecture Overview

```
Browser --> EdgeOne CDN (serves static React SPA: index.html + JS/CSS)
              |
              +--> Edge Function (proxies /api/*, /oauth/*)
                     |
                     +--> PHP/Laravel API Server (CVM)
                          OAuth2/Passport + PKCE authentication
                          CORS-enabled
```

---

## P0 - Critical (Must Fix Before Deployment)

### 1. Fix OAuth Scope Typo

- **File**: `app/Providers/AuthServiceProvider.php:33`
- **Issue**: `'Closet.ReadWrtie'` is misspelled, should be `'Closet.ReadWrite'`
- **Impact**: The SPA requests scope `Closet.ReadWrite` (in `auth/AuthService.ts:66`), but the backend registers it as `Closet.ReadWrtie`. All closet write operations via OAuth will fail with a scope mismatch error.
- **Fix**: Change `'Closet.ReadWrtie'` to `'Closet.ReadWrite'` on line 33.

### 2. Add Missing SPA Routes in App.tsx

- **File**: `resources/assets/src/App.tsx`
- **Issue**: The sidebar (`layouts/Sidebar.tsx`) links to 8 routes that don't exist in the SPA router. Clicking them shows "Page not found".
- **Missing routes**:

| Route              | Page Component                  | Notes                                                           |
| ------------------ | ------------------------------- | --------------------------------------------------------------- |
| `/user/profile`    | `views/user/Profile.tsx`        | User profile settings (email, password, avatar, delete account) |
| `/user/reports`    | `views/user/Reports.tsx`        | User's submitted reports                                        |
| `/admin/customize` | `views/admin/Customization.tsx` | Site customization (home page, CSS, scripts)                    |
| `/admin/score`     | `views/admin/ScoreOptions.tsx`  | Score system settings                                           |
| `/admin/options`   | `views/admin/Options.tsx`       | General site options                                            |
| `/admin/resource`  | `views/admin/Resource.tsx`      | Resource/storage options                                        |
| `/admin/status`    | `views/admin/Status.tsx`        | Server status page                                              |
| `/admin/update`    | `views/admin/Update.tsx`        | Update checker                                                  |

- **Fix**: Add lazy-loaded route entries for each missing page in `App.tsx`. Check if the corresponding view components already exist in `resources/assets/src/views/`. If they do, just add the route. If they don't, they need to be created as SPA-compatible components (they currently exist as server-rendered React widgets that mount into Twig-provided DOM elements).

### 3. Fix Edge Function CORS for /oauth/\* Responses

- **File**: `edge-functions/api-proxy.js`
- **Issue**: The `/api/*` proxy adds CORS headers to responses (lines 23-27), but the `/oauth/*` proxy does NOT add CORS headers on non-redirect responses (line 60 returns `response` directly).
- **Impact**: Cross-origin `POST /oauth/token` requests (token exchange, token refresh) will fail due to missing `Access-Control-Allow-Origin` header.
- **Fix**: Add the same CORS headers to `/oauth/*` responses:
  ```js
  // After line 59, before returning response:
  const newHeaders = new Headers(response.headers)
  newHeaders.set(
    'Access-Control-Allow-Origin',
    request.headers.get('Origin') || '*',
  )
  newHeaders.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  )
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  newHeaders.set('Access-Control-Allow-Credentials', 'true')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
  ```

### 4. Handle OPTIONS Preflight in Edge Function

- **File**: `edge-functions/api-proxy.js`
- **Issue**: No explicit handling for `OPTIONS` preflight requests. The browser sends `OPTIONS` before cross-origin `POST`/`PUT`/`DELETE` requests. Without handling, these may fail or get proxied unnecessarily.
- **Fix**: Add an early return for `OPTIONS` requests at the top of the fetch handler:
  ```js
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
        'Access-Control-Allow-Methods':
          'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }
  ```

### 5. Verify OAuth Authorize Flow Works Cross-Origin

- **File**: `resources/assets/src/auth/AuthService.ts:72`
- **Issue**: `window.location.href = \`${apiBase}/oauth/authorize?...\``redirects the browser to the PHP backend's`/oauth/authorize` endpoint. This requires the user to have a **session** on the PHP backend to approve the OAuth grant. If the user has never visited the PHP backend directly, they will see the Laravel login page (server-rendered Twig), not the SPA login.
- **Impact**: The OAuth flow depends on the PHP backend's session-based login page still working. The Twig templates must remain functional on the backend server for this flow.
- **Action**: Ensure the PHP backend's web routes and Twig templates are NOT removed. The backend must continue serving the traditional login page at `/auth/login` for the OAuth authorize flow. Only the SPA's webpack output changes; the PHP server-side rendering must remain intact for the OAuth consent screen.

---

## P1 - Important (Should Fix Before Deployment)

### 6. Fix DetectLanguagePrefer Middleware No-op

- **File**: `app/Http/Middleware/DetectLanguagePrefer.php:22`
- **Issue**: `$locale ?? app()->getLocale();` -- the null coalescing result is not assigned to anything. This is a no-op statement.
- **Fix**: Change to `$locale = $locale ?? app()->getLocale();`

### 7. Restore Webpack Twig Output for Backend

- **File**: `webpack.config.ts`
- **Issue**: The webpack config was modified to only generate `index.html` for the SPA. However, as noted in item #5, the PHP backend still needs to serve its own pages (at minimum the OAuth authorize/login flow). The backend's Twig templates reference asset includes that webpack no longer generates.
- **Options**:
  - **Option A (Recommended)**: Keep the SPA webpack config as-is. The backend's OAuth login page can use its own minimal CSS/JS (Bootstrap CDN + inline styles) without depending on webpack-generated assets. Modify the Twig templates to be self-contained.
  - **Option B**: Add a second webpack entry/config that generates the Twig asset fragments alongside the SPA `index.html`. More complex but preserves full backward compatibility.
- **Decision needed**: Choose between Option A (simpler, some Twig template work) or Option B (more webpack complexity, full compatibility).

### 8. Clean Up Dead Code

Remove files and code that are no longer used in the SPA architecture:

| File/Code                                   | Reason                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| `resources/assets/src/scripts/route.tsx`    | Old DOM-element-based routing system, replaced by `App.tsx` + React Router |
| `HtmlWebpackEnhancementPlugin` references   | Already removed from webpack config, but check for any remaining imports   |
| `resources/assets/src/scripts/extra.ts`     | Check if still needed; was used for server-injected `blessing.extra`       |
| Old entry points in webpack config comments | Clean up commented-out code                                                |

### 9. Ensure SPA Components Don't Depend on Server-Injected Globals

- **Issue**: Many existing view components access `blessing.extra.*`, `blessing.route`, `blessing.base_url`, etc. These are injected by Twig templates via `<script>` tags. In SPA mode, these won't exist unless `polyfill.ts` provides them.
- **Files to audit**:
  - All files in `resources/assets/src/views/` that reference `blessing.*`
  - `resources/assets/src/scripts/app.ts` (imports init which sets up `blessing`)
  - `resources/assets/src/scripts/init.ts` (public path setup)
- **Fix**: Either:
  - Ensure `polyfill.ts` provides all needed defaults, OR
  - Refactor components to use `useAppConfig()` context instead of `window.blessing`

### 10. Add Authentication Guards to SPA Routes

- **File**: `resources/assets/src/App.tsx`
- **Issue**: No route protection. All routes (including `/user/*` and `/admin/*`) are accessible without authentication. There's no redirect to login for unauthenticated users, and no admin role check for `/admin/*` routes.
- **Fix**: Create `PrivateRoute` and `AdminRoute` wrapper components that check `useAuth()` state and redirect to `/auth/login` if not authenticated (or show 403 for non-admin users).

### 11. Fix `net.ts` Token Refresh Race Condition

- **File**: `resources/assets/src/scripts/net.ts:131-148`
- **Issue**: The token refresh logic uses a module-level `isRefreshing` flag and `refreshPromise`. If `refreshPromise` is set to `null` in the `.finally()` callback (line 138) before the `await refreshPromise` on line 140 resolves for a concurrent request, the concurrent request will `await null`, which resolves immediately as `undefined`, not `boolean`.
- **Fix**: Don't set `refreshPromise = null` in `.finally()`. Instead, let it persist and only clear it when a new refresh is needed.

---

## P2 - Nice to Have (Can Fix Later)

### 12. Fix `bootstrap/chkenv.php` Issues

- **Line 5**: `ini_set('display_errors', true)` should be `ini_set('display_errors', '1')` (PHP 8.x deprecation)
- **Lines 83-88**: Duplicate unreachable `is_writable` check (dead code after the first check exits on failure)

### 13. Fix Silently Swallowed QueryException

- **File**: `app/Services/Option.php:76`
- **Issue**: `catch (QueryException $e) {}` silently ignores database write failures. At minimum, log the error.

### 14. Update Type Declarations

- **File**: `package.json`
- `@types/react` is `^16.9.35` but `react` is `^17.0.1` -- should be `@types/react@^17.0.0`
- `@types/react-dom` is `^16.9.8` but `react-dom` is `^17.0.1` -- should be `@types/react-dom@^17.0.0`

### 15. Replace Deprecated `react-hot-loader`

- **Files**: `package.json`, `webpack.config.ts`
- `react-hot-loader` and `@hot-loader/react-dom` are deprecated. Replace with React Fast Refresh via `@pmmmwh/react-refresh-webpack-plugin`.

### 16. Use Laravel's Built-in CORS Instead of Custom Middleware

- **Files**: `app/Http/Middleware/HandleCors.php`, `config/cors.php`, `app/Http/Kernel.php`
- Laravel 10 includes built-in CORS handling. Consider using `config/cors.php` with Laravel's built-in `\Illuminate\Http\Middleware\HandleCors::class` instead of the custom middleware. This provides more robust CORS handling (e.g., proper Vary headers, credential handling).

### 17. Update Deprecated Passport Middleware

- **File**: `app/Http/Kernel.php:69-70`
- `CheckForAnyScope` and `CheckScopes` are deprecated in Passport 11. Use `can` middleware with token abilities instead.

### 18. Fix `FILESYSTEM_DRIVER` Env Variable

- **File**: `config/filesystems.php:15`
- `FILESYSTEM_DRIVER` was renamed to `FILESYSTEM_DISK` in Laravel 9+. Update the env variable name.

### 19. Clean Up Stale Build Artifacts

- **Directory**: `public/app/`
- Contains 7 different `app.*.js` bundles from multiple builds. Add a `clean-webpack-plugin` or `output.clean: true` to webpack config to auto-clean before each build.

### 20. Fix `$faker->email` Property Access

- **File**: `database/factories/UserFactory.php:16`
- Change `$this->faker->email` to `$this->faker->email()` (method call) to avoid deprecation notices in newer Faker versions.

### 21. Resolve Symfony Package Version Mismatch

- **File**: `composer.json`
- `symfony/yaml: ^5.0` is behind `symfony/process: ^6.0`. Laravel 10 uses Symfony 6.x components. Update to `symfony/yaml: ^6.0` for consistency.

---

## Files Changed Summary

### Modified (13 tracked files):

| File                                        | Change Description                                                     |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| `app/Http/Controllers/HomeController.php`   | Added `siteConfig()` and `i18n()` API methods                          |
| `app/Http/Kernel.php`                       | Added `HandleCors` to API group; `authorize` now accepts `oauth` guard |
| `package.json`                              | Added `react-router-dom`, `@types/react-router-dom`                    |
| `resources/assets/src/index.tsx`            | Changed from route-matching to rendering `<App/>` SPA                  |
| `resources/assets/src/scripts/i18n.ts`      | Added `loadI18n()` for API-based translation loading                   |
| `resources/assets/src/scripts/init.ts`      | Simplified public path handling                                        |
| `resources/assets/src/scripts/net.ts`       | Added Bearer token auth, token refresh, configurable base URL          |
| `resources/assets/src/shims.d.ts`           | Updated type declarations                                              |
| `resources/assets/src/views/auth/Login.tsx` | Rewritten from form-based to OAuth redirect                            |
| `resources/assets/src/webpack.d.ts`         | Added SPA env var declarations                                         |
| `routes/api.php`                            | Added `/api/site-config` and `/api/i18n/{locale}` endpoints            |
| `webpack.config.ts`                         | Single entry, generates `index.html`, `historyApiFallback`, env vars   |
| `yarn.lock`                                 | Updated lockfile                                                       |

### New (11 untracked files/directories):

| File                                           | Purpose                                                                    |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| `.env.spa.example`                             | SPA environment variables template                                         |
| `app/Http/Middleware/HandleCors.php`           | Custom CORS middleware                                                     |
| `config/cors.php`                              | CORS configuration                                                         |
| `edge-functions/api-proxy.js`                  | EdgeOne edge function for API proxying                                     |
| `resources/assets/src/App.tsx`                 | SPA root component with React Router                                       |
| `resources/assets/src/auth/`                   | OAuth2 PKCE authentication module (4 files)                                |
| `resources/assets/src/contexts/`               | React context providers (AppConfig)                                        |
| `resources/assets/src/layouts/`                | Layout components (MainLayout, AuthLayout, Header, Sidebar, SkinlibLayout) |
| `resources/assets/src/scripts/polyfill.ts`     | `window.blessing` defaults for SPA mode                                    |
| `resources/assets/src/views/auth/Callback.tsx` | OAuth callback handler                                                     |
| `resources/assets/template.html`               | SPA HTML shell template                                                    |

---

## Testing Checklist

Before deploying, verify:

- [ ] OAuth login flow works end-to-end (SPA -> backend login -> authorize -> callback -> token)
- [ ] Token refresh works when access token expires
- [ ] All sidebar navigation links lead to working pages
- [ ] Admin pages are only accessible to admin users
- [ ] Skin library browsing works without authentication
- [ ] Skin upload works with OAuth token
- [ ] Player management (CRUD) works
- [ ] Closet operations work (add/remove skins)
- [ ] i18n translations load correctly in SPA
- [ ] Edge function correctly proxies all API and OAuth requests
- [ ] CORS preflight requests succeed for all endpoints
- [ ] 401 responses trigger token refresh, not immediate logout
- [ ] The PHP backend's OAuth authorize page still renders correctly (Twig templates)
