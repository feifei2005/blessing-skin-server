# SPA Migration — Issue Tracker

> Updated: 2026-05-08 (fifth review — all issues resolved)
> Architecture: React SPA (EdgeOne Pages CDN) + PHP/Laravel API Backend (CVM)
> Auth: OAuth2/Passport + PKCE

---

## Critical Bugs

### B1. `Sidebar.tsx` — `SideMenuLink` has two `return` statements ✅

- **Status**: [x] Fixed (commit `ace675f`)
- **Fix**: Merged into single `return` with both `exact={item.exact}` and child elements.
- **Verified**: `SideMenuLink` now has one return statement. `SideMenuItem` has two returns but that is intentional (if/else branching).

### B2. `handleProfile` password change — SPA does not clear token ✅

- **Status**: [x] Fixed
- **Fix**: `ProfilePage.tsx` now calls `logout()` after password/email change instead of `refreshUser()`.
- **Verified**: Lines 49, 73 call `logout()`. `refreshUser()` is only used for nickname/avatar changes.

### B3. `handleProfile` account deletion — token not cleared before redirect ✅

- **Status**: [x] Fixed
- **Fix**: `ProfilePage.tsx` now calls `logout()` instead of bare `window.location.href = '/'`.
- **Verified**: Line 107 calls `logout()`. No bare `window.location.href` in the file.

### B4. `ProfilePage.tsx` — duplicate form rendering ✅

- **Status**: [x] Fixed
- **File**: `resources/assets/src/views/user/ProfilePage.tsx`
- **Problem**: The password, email, avatar, and delete tab forms were each rendered **twice** in the JSX.
- **Fix**: Deleted the second set of forms (hardcoded English strings, lines 291–403).
- **Verified**: Only one set of forms remains, all using `t()` for i18n labels.

---

## High Priority

### H1. Auth pages do not use `AuthLayout` ✅

- **Status**: [x] Fixed
- **Fix**: `App.tsx` auth routes (`/auth/register`, `/auth/forgot`, `/auth/reset/:uid`) now use `AuthLayout`.
- **Verified**: `AuthLayout` is imported and used. `/auth/login` renders its own layout internally (acceptable).

### H2. `SkinlibLayout.tsx` created but unused ✅

- **Status**: [x] Fixed
- **Fix**: `App.tsx` skinlib routes now use `SkinlibLayout`. Layout uses `useAuth()` and React Router `<Link>`.
- **Verified**: All three skinlib routes (`/skinlib`, `/skinlib/show/:id`, `/skinlib/upload`) use `SkinlibLayout`.

### H3. `AdminRoute` does not distinguish admin vs super-admin ✅

- **Status**: [x] Fixed
- **Fix**: `AdminRoute` now accepts `requiredPermission` prop (defaults to 1). `/admin/update` uses `requiredPermission={2}`. `PluginsManagement` now uses `useAuth()` to conditionally hide upload/wget sections from non-super-admin users.
- **Verified**: Guards.tsx checks `user?.permission` against `requiredPermission`. PluginsManagement hides upload and download cards when `user.permission < 2`.

### H4. Admin Dashboard is a placeholder ✅

- **Status**: [x] Fixed
- **Fix**: Added summary stat cards (users, players, textures, disk usage) from `/api/admin/dashboard`. Chart table now includes progress bars for visual comparison. Added `AdminController::dashboardData()` endpoint and `routes/api.php` route.
- **Verified**: Dashboard shows 4 AdminLTE small-box stat cards with live data and a chart table with bar visualization.

### H5. `recaptcha_secretkey` exposed to frontend via API ✅

- **Status**: [x] Fixed
- **Fix**: `Api\OptionsController::general()` no longer returns `recaptcha_secretkey`. It is still accepted on POST (save) but never returned on GET.
- **Verified**: Confirmed in the controller source.

### H6. Edge Function does not proxy static resource paths ✅

- **Status**: [x] Fixed
- **Fix**: `PROXIED_PATHS` now includes `/textures/`, `/avatar/`, `/preview/`, `/raw/`, `/csl/`, and specific `/auth/*` sub-routes.
- **Verified**: Confirmed in `edge-functions/api-proxy.js`.
- **Note**: `/auth/logout` is not in `PROXIED_PATHS`. This is acceptable because the SPA's `AuthService.logout()` only clears local tokens and does not call the backend. The legacy `scripts/logout.ts` (which POSTs to `/auth/logout`) is imported via `app.ts` but its DOM binding (`#logout-button`) targets an element that does not exist in the SPA, so it never fires.

---

## Medium Priority

### M1. Header / Sidebar depend on jQuery + AdminLTE JS ✅ (verified non-issue)

- **Status**: [x] Verified — not an issue
- **Reason**: AdminLTE JS is imported via `app.ts` line 2 (`import 'admin-lte'`). jQuery is imported in `index.tsx` and exposed on `window.$`. Bootstrap JS is imported in `components/Modal.tsx`. All three are bundled by webpack and available at runtime. `data-toggle="dropdown"`, `data-widget="pushmenu"`, and `data-widget="treeview"` all function correctly.

### M2. `window.blessing` global may not be initialized before access ✅ (verified non-issue)

- **Status**: [x] Verified — not an issue
- **Reason**: `index.tsx` imports `./scripts/polyfill` as its very first import (line 1), which sets `window.blessing` to a complete default object with all expected properties (`base_url`, `extra`, `i18n`, `fetch`, `event`, `notify`, `t`, etc.). This executes before `./scripts/app` (line 5), which is where modules that read/write `blessing.*` are imported. In server-rendered mode, `shared/head.twig` injects `window.blessing` via inline `<script>` before any bundles load.

### M3. OAuth authorization page CSS/JS self-containment ✅ (verified)

- **Status**: [x] Verified — self-contained
- **File**: `resources/views/auth/base.twig`
- **Verification**: `auth/base.twig` loads all CSS (Bootstrap 4.6.2, AdminLTE 3.2.0, Font Awesome 6.3.0) and JS (jQuery 3.6.0, Bootstrap bundle) via CDN `<link>` and `<script>` tags from jsdelivr.net. There are zero references to `mix()`, webpack manifest, or locally-built assets. The `shared.head` and `shared.foot` includes reference `assets.style` and `assets.app` with `ignore_missing = true`, so they gracefully degrade when no webpack-generated templates are present. `vendor/passport/authorize.twig` extends `auth.base` and inherits all CDN links. The OAuth `/oauth/authorize` page renders correctly without webpack assets.

### M4. `ResponseBody` type mismatch — admin options save shows error toast ✅

- **Status**: [x] Fixed
- **Fix**: All `Api\OptionsController` save methods now use the `json()` helper which returns `{ code: 0, message: "..." }` format.
- **Verified**: `saveCustomize()`, `saveScore()`, `saveGeneral()`, `saveResource()`, `clearCache()` all return `json(trans(...), 0)`.

### M5. Registration / forgot / reset password — POST targets not proxied ✅ (verified non-issue)

- **Status**: [x] Verified — not an issue
- **Reason**: Edge Function `PROXIED_PATHS` includes `/auth/login`, `/auth/register`, `/auth/forgot`, `/auth/reset`, `/auth/captcha`, `/auth/verify`, `/auth/bind`. These use `startsWith` matching, so POST requests to these paths are proxied to the backend.

### M6. `urls.ts` — `auth.logout` points to web route `/auth/logout` ⚠️ (dead code, low risk)

- **Status**: [x] Verified — low risk
- **Reason**: `urls.auth.logout()` is only referenced in `scripts/logout.ts:16`, which is a legacy module. In the SPA, logout is handled by `AuthService.logout()` (clears localStorage token, redirects to `/`). The legacy `logout.ts` binds to `#logout-button` which does not exist in the SPA DOM, so the POST to `/auth/logout` never fires. The code is dead but harmless.
- **Recommendation**: Clean up `scripts/logout.ts` import from `app.ts` in a future refactor.

### M7. Missing `/skinlib/upload` route in `App.tsx` ✅

- **Status**: [x] Fixed
- **Fix**: `App.tsx` now has a `/skinlib/upload` route wrapped in `SkinlibLayout`.
- **Verified**: Confirmed in `App.tsx`.

### M8. `Options.tsx` — `recaptcha_secretkey` field may silently overwrite saved value ✅

- **Status**: [x] Fixed
- **File**: `resources/assets/src/views/admin/Options.tsx`, `app/Http/Controllers/Api/OptionsController.php`
- **Problem**: After the H5 security fix, the backend `general()` GET no longer returns `recaptcha_secretkey`. The frontend field always appeared empty, and submitting the form would POST an empty value, overwriting the saved key.
- **Fix**: Backend `saveGeneral()` now skips writing `recaptcha_secretkey` when the submitted value is empty. Frontend field changed to `type="password"` with a placeholder "Leave blank to keep current value" (i18n'd via `options.recaptcha.secret_key_placeholder`).

---

## Low Priority / Code Quality

### L1. `SkinlibLayout.tsx` hardcodes "Guest" username ✅

- **Status**: [x] Fixed
- **Fix**: `SkinlibLayout` now uses `useAuth()` to show the actual user's nickname when logged in, and "Guest" only when not authenticated.
- **Verified**: Confirmed in `SkinlibLayout.tsx`.

### L2. `MainLayout.tsx` footer hardcodes version and copyright ✅

- **Status**: [x] Fixed
- **Fix**: Footer now uses `useAppConfig()` for dynamic `version` and `siteName` with fallbacks.
- **Verified**: Confirmed in `MainLayout.tsx`.

### L3. New admin pages lack i18n ✅

- **Status**: [x] Fixed
- **Fix**: All hardcoded strings replaced with `t()` calls. Added missing i18n keys to `en/admin.yml`, `en/general.yml`, `en/options.yml` and corresponding `zh_CN` translations.
- **Details by page**:

| Page                    | Status                                                                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Dashboard.tsx`         | Fixed — `t()` imported, all 4 strings replaced (`general.dashboard`, `admin.index.welcome`, `admin.index.monthly-statistics`, `admin.index.day`)               |
| `Options.tsx`           | Fixed — 5 strings replaced (`options.general.player_name_length.min/max`, `options.recaptcha.title`, `options.recaptcha.secret_key`, `general.failed-to-load`) |
| `Status.tsx`            | Fixed — 4 strings replaced (`general.failed-to-load`, `admin.status.no-plugins`, `admin.status.plugin-name`, `admin.status.plugin-version`)                    |
| `UpdatePage.tsx`        | Fixed — 1 string replaced (`admin.update.info.no-info`)                                                                                                        |
| `ScoreOptions.tsx`      | Fixed — 1 string replaced (`general.failed-to-load`)                                                                                                           |
| `CustomizationPage.tsx` | Fixed — 1 string replaced (`general.failed-to-load`)                                                                                                           |
| `Resource.tsx`          | Fixed — 1 string replaced (`general.failed-to-load`)                                                                                                           |
| `ProfilePage.tsx`       | Fixed — duplicate hardcoded form set removed (see B4)                                                                                                          |

### L4. Missing error handling in `useEffect` fetch calls ✅

- **Status**: [x] Fixed
- **Fix**: Added `.catch(() => {})` to all `useEffect` fetch chains in `Dashboard.tsx`, `Options.tsx`, `Status.tsx`, `UpdatePage.tsx`, `ScoreOptions.tsx`, `CustomizationPage.tsx`, and `Resource.tsx`. Network errors are now silently caught; `.finally()` still runs to stop the loading spinner, and the null-guard UI shows the localized "Failed to load" message.

### L5. Dockerfile not optimized for SPA deployment ✅

- **Status**: [x] Fixed
- **Fix**: Added `Dockerfile.spa` for standalone SPA frontend build. Original `Dockerfile` remains for PHP API backend.
- **Verified**: `Dockerfile.spa` exists (30 lines), builds static files to `/app/public/app/`.

### L6. `.catch(() => {})` silently swallows errors ✅

- **Status**: [x] Fixed
- **Files**: All admin pages (`Dashboard.tsx`, `CustomizationPage.tsx`, `Options.tsx`, `ScoreOptions.tsx`, `Resource.tsx`, `Status.tsx`, `UpdatePage.tsx`)
- **Fix**: Replaced all `.catch(() => {})` with `.catch((e) => console.warn('[PageName] fetch failed:', e))`. Network errors, CORS failures, and backend errors are now logged to the console for debugging while still being non-disruptive to the user.

---

## Summary

| Category        | Total  | Fixed  | Partial | Open  | Verified non-issue |
| --------------- | ------ | ------ | ------- | ----- | ------------------ |
| Critical Bugs   | 4      | 4      | 0       | 0     | 0                  |
| High Priority   | 6      | 6      | 0       | 0     | 0                  |
| Medium Priority | 8      | 3      | 0       | 0     | 5                  |
| Low Priority    | 6      | 6      | 0       | 0     | 0                  |
| **Total**       | **24** | **19** | **0**   | **0** | **5**              |

### All items resolved. No open, partial, or unverified items remain.
