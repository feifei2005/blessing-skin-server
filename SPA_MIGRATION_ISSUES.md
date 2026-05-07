# SPA Migration — Issue Tracker

> Updated: 2026-05-08
> Architecture: React SPA (EdgeOne Pages CDN) + PHP/Laravel API Backend (CVM)
> Auth: OAuth2/Passport + PKCE

---

## Critical Bugs — All Resolved ✅

### B1. `Sidebar.tsx` — `SideMenuLink` has two `return` statements (dead code bug) ✅

- **Status**: [x] Fixed (commit `ace675f`)
- **Fix**: Merged into single `return` with both `exact={item.exact}` and child elements.

### B2. `handleProfile` password change — SPA does not clear token ✅

- **Status**: [x] Fixed
- **Fix**: `ProfilePage.tsx` now calls `logout()` (clears token + redirects) after password/email change instead of `refreshUser()`.

### B3. `handleProfile` account deletion — token not cleared before redirect ✅

- **Status**: [x] Fixed
- **Fix**: `ProfilePage.tsx` now calls `logout()` (which clears localStorage token) instead of bare `window.location.href = '/'`.

---

## High Priority

### H1. Auth pages do not use `AuthLayout` ✅

- **Status**: [x] Fixed
- **Fix**: `App.tsx` auth routes (`/auth/register`, `/auth/forgot`, `/auth/reset/:uid`) now use `AuthLayout` instead of `MainLayout`.

### H2. `SkinlibLayout.tsx` created but unused ⚠️ Deferred

- **Status**: [ ] Open
- **Reason**: `SkinlibLayout` is not used in `App.tsx` (skinlib routes use `MainLayout`). L1 partially fixed (added `useAuth()` + `<Link>`). Full migration to `SkinlibLayout` for skinlib routes would require broader routing changes.

### H3. `AdminRoute` does not distinguish admin vs super-admin ⚠️ Deferred

- **Status**: [ ] Open
- **Reason**: Requires adding `permission` field to `/api/user` response and optional `requiredPermission` prop on `AdminRoute`. Backend already enforces at API level, frontend guard is a UX improvement.

### H4. Admin Dashboard is a placeholder ✅

- **Status**: [x] Fixed
- **Fix**: `views/admin/Dashboard.tsx` now fetches chart data from `/api/admin/chart` and displays monthly statistics table.

### H5. `recaptcha_secretkey` exposed to frontend via API ✅

- **Status**: [x] Fixed
- **Fix**: Removed `recaptcha_secretkey` from `general()` GET response. `saveGeneral()` still accepts it on POST for writing.

### H6. Edge Function does not proxy static resource paths ✅

- **Status**: [x] Fixed
- **Fix**: `edge-functions/api-proxy.js` now proxies all backend paths via a `PROXIED_PATHS` list: `/api/*`, `/oauth/*`, `/textures/*`, `/avatar/*`, `/preview/*`, `/raw/*`, `/csl/*`, `/auth/*`. The function was refactored to use a unified proxy handler with redirect rewriting.

---

## Medium Priority

### M1. Header / Sidebar depend on jQuery + AdminLTE JS ⚠️ Verified

- **Status**: [x] Verified — `scripts/app.ts` imports `admin-lte` which bundles jQuery + Bootstrap + AdminLTE JS. The `data-widget` attributes function correctly in SPA mode.

### M2. `window.blessing` global may not be initialized before access ⚠️ Verified

- **Status**: [x] Verified — `polyfill.ts` (first import in `index.tsx`) sets `window.blessing = { ... }` before any other script runs. No risk of undefined access.

### M3. OAuth authorization page CSS/JS self-containment ⚠️ Verified

- **Status**: [x] Verified — `auth/base.twig` was updated with Bootstrap 4 CDN + AdminLTE CDN + Font Awesome CDN links. OAuth pages render independently of webpack.

### M4. `ResponseBody` type mismatch — admin options save always shows error toast ✅

- **Status**: [x] Fixed
- **Fix**: All `Api\OptionsController` save methods changed from `response()->json(['message' => ...])` to `json(trans(...), 0)` which includes the `code: 0` field the frontend expects.

### M5. Registration / forgot / reset password — POST targets not proxied ✅

- **Status**: [x] Fixed
- **Fix**: Added `/auth/*` paths to `PROXIED_PATHS` in Edge Function (merged into H6 fix).

### M6. `urls.ts` — `auth.logout` points to web route `/auth/logout` ⚠️ Verified

- **Status**: [x] Verified — No production code references `urls.auth.logout()`. Logout is handled via `useAuth().logout()` (local-only) or `logout.ts` (legacy DOM script with null-guard).

### M7. Missing `/skinlib/upload` route in `App.tsx` ⚠️ Verified

- **Status**: [x] Verified — Route already exists at `App.tsx:177`: `<Route path="/skinlib/upload">`. Upload component is lazy-loaded.

---

## Low Priority / Code Quality

### L1. `SkinlibLayout.tsx` hardcodes "Guest" username ✅

- **Status**: [x] Fixed
- **Fix**: Now uses `useAuth()` to show logged-in user's nickname or "Guest" fallback. Also replaced `<a href>` with React Router `<Link>`.

### L2. `MainLayout.tsx` footer hardcodes version and copyright ✅

- **Status**: [x] Fixed
- **Fix**: Now uses `useAppConfig()` for dynamic `{version}` and `{siteName}` in footer.

### L3. New admin pages lack i18n ⚠️ Deferred

- **Status**: [ ] Open
- **Reason**: 8 admin pages (`CustomizationPage`, `Options`, `ScoreOptions`, `Resource`, `Status`, `UpdatePage`, `Reports`, `ProfilePage`) have English-only labels. Full i18n requires confirming translation keys in `resources/lang/` and replacing all hardcoded strings with `t()` calls.

### L4. Missing error handling in `useEffect` fetch calls ⚠️ Deferred

- **Status**: [ ] Open
- **Reason**: Multiple pages have `fetch.get(...)` in `useEffect` with `.then()` but no `.catch()`. Adding `.catch()` to each page is mechanical but spans many files. Low risk since the `fetch` layer already handles errors via `walkFetch`.

### L5. Dockerfile not optimized for SPA deployment ⚠️ Deferred

- **Status**: [ ] Open
- **Reason**: Current Dockerfile builds PHP + frontend as monolith. For the SPA architecture separation, should have two Dockerfiles or a multi-stage build. This is a deployment/infra concern, not a code change.

---

## Summary

| Category        | Total  | Fixed  | Verified | Deferred |
| --------------- | ------ | ------ | -------- | -------- |
| Critical Bugs   | 3      | 3      | 0        | 0        |
| High Priority   | 6      | 4      | 0        | 2        |
| Medium Priority | 7      | 2      | 5        | 0        |
| Low Priority    | 5      | 2      | 0        | 3        |
| **Total**       | **21** | **11** | **5**    | **5**    |

### Effectively resolved: 16/21 (11 fixed + 5 verified as non-issues)

### Deferred (5):

| ID  | Reason                                                                 |
| --- | ---------------------------------------------------------------------- |
| H2  | SkinlibLayout unused — requires broader skinlib route restructure      |
| H3  | AdminRoute super-admin — backend enforces, frontend guard is UX polish |
| L3  | Admin page i18n — 8 pages, needs translation key audit                 |
| L4  | useEffect error handling — many files, low risk                        |
| L5  | Dockerfile separation — deployment/infra concern                       |
