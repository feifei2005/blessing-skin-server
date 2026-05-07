# SPA Migration — Issue Tracker

> Created: 2026-05-08
> Architecture: React SPA (EdgeOne Pages CDN) + PHP/Laravel API Backend (CVM)
> Auth: OAuth2/Passport + PKCE

---

## Critical Bugs

### B1. `Sidebar.tsx` — `SideMenuLink` has two `return` statements (dead code bug)

- **File**: `resources/assets/src/layouts/Sidebar.tsx` — `SideMenuLink` component
- **Problem**: The component has two consecutive `return (` statements. The first `return` includes `exact={item.exact}` but is missing child elements (icon and text). The second `return` has the full children but lacks the `exact` prop. Since JavaScript only executes the first `return`, the result is either an empty NavLink (no icon/text rendered) or a parse error that crashes the component.
- **Impact**: Sidebar menu items may render as empty/broken links, or the entire sidebar fails to render.
- **Fix**: Merge into a single `return` that includes both `exact={item.exact}` and the child elements (icon + text).
- **Status**: [ ] Open

### B2. `handleProfile` password change — SPA does not clear token

- **Files**: `app/Http/Controllers/UserController.php` (`handleProfile`), `resources/assets/src/views/user/ProfilePage.tsx`
- **Problem**: On `action=password` and `action=email`, the backend skips `Auth::logout()` when using Bearer token mode, but does **not** revoke the OAuth token. The frontend `ProfilePage.tsx` only calls `refreshUser()` on success instead of `logout()`. After a password change the old token remains valid — a security concern.
- **Fix**: After a successful password change, the frontend should call `logout()` to force re-authentication; alternatively the backend should revoke the current OAuth access token.
- **Status**: [ ] Open

### B3. `handleProfile` account deletion — token not cleared before redirect

- **File**: `resources/assets/src/views/user/ProfilePage.tsx`
- **Problem**: After successful account deletion the code runs `window.location.href = '/'` without first clearing the token from localStorage. On the next visit `isAuthenticated()` still returns `true`, causing the app to attempt API requests with a deleted user's token.
- **Fix**: Call `logout()` (which calls `clearToken()`) before redirecting.
- **Status**: [ ] Open

---

## High Priority

### H1. Auth pages do not use `AuthLayout`

- **Files**: `resources/assets/src/App.tsx`, `resources/assets/src/layouts/AuthLayout.tsx`
- **Problem**: `AuthLayout.tsx` has been created but is never imported or referenced. In `App.tsx` the `/auth/register`, `/auth/forgot`, and `/auth/reset/:uid` routes use `MainLayout` (full sidebar + header), which is inappropriate for authentication pages. The Login page renders a bare component with no layout wrapper at all.
- **Fix**: Wrap auth-related routes with `AuthLayout`.
- **Status**: [ ] Open

### H2. `SkinlibLayout.tsx` created but unused

- **Files**: `resources/assets/src/App.tsx`, `resources/assets/src/layouts/SkinlibLayout.tsx`
- **Problem**: `SkinlibLayout.tsx` provides a standalone navbar layout for the skin library, but `App.tsx` uses `MainLayout` for skinlib routes instead. Additionally, `SkinlibLayout` uses `<a href>` instead of React Router `<Link>`, which would cause full-page reloads.
- **Decision**: Either use it for skinlib routes (and fix the links to use `<Link>`), or delete it.
- **Status**: [ ] Open

### H3. `AdminRoute` does not distinguish admin vs super-admin

- **File**: `resources/assets/src/components/Guards.tsx:37`
- **Problem**: `AdminRoute` only checks `user?.admin` (boolean), but the backend has two permission levels: `admin` and `super-admin`. Routes like `/admin/update` and `/admin/plugins/upload` require `super-admin` on the backend, but the frontend allows any admin to access these pages — they only get a 403 when the API call is made.
- **Fix**: Add a `permission` numeric field to the `/api/user` response; support an optional `requiredPermission` prop on `AdminRoute`.
- **Status**: [ ] Open

### H4. Admin Dashboard is a placeholder

- **File**: `resources/assets/src/views/admin/Dashboard.tsx`
- **Problem**: Only 18 lines — renders a static alert box. Missing:
  - Chart data from `/api/admin/chart`
  - User / player / texture count statistics
  - System notification functionality
- **Impact**: The admin dashboard is non-functional compared to the original system.
- **Status**: [ ] Open

### H5. `recaptcha_secretkey` exposed to frontend via API

- **File**: `app/Http/Controllers/Api/OptionsController.php` — `general()` method
- **Problem**: The `general()` method returns `recaptcha_secretkey` in its JSON response. This is the reCAPTCHA **server-side secret key** and must never be exposed to the frontend. Only `recaptcha_sitekey` is needed client-side.
- **Fix**: Remove `recaptcha_secretkey` from the `general()` return value. Handle it separately in `saveGeneral()` (accept it on POST but never return it on GET).
- **Status**: [ ] Open

### H6. Edge Function does not proxy static resource paths

- **File**: `edge-functions/api-proxy.js`
- **Problem**: The Edge Function only proxies `/api/*` and `/oauth/*`, but the following paths also need to reach the backend:
  - `/textures/{hash}` — Minecraft client fetches texture files
  - `/avatar/*` — Avatar images
  - `/preview/*` — Texture preview images
  - `/raw/*` — Raw texture files
  - `/csl/*` — CustomSkinLoader API
  - `/auth/*` — Registration, forgot password, reset password (see M5)
- **Impact**: Minecraft clients will be unable to load skins in-game; avatar/preview images will 404.
- **Fix**: Add proxy rules in the Edge Function for all paths defined in `routes/static.php` (and optionally `routes/web.php` auth routes).
- **Status**: [ ] Open

---

## Medium Priority

### M1. Header / Sidebar depend on jQuery + AdminLTE JS

- **Files**: `resources/assets/src/layouts/Header.tsx:13`, `resources/assets/src/layouts/Sidebar.tsx:140`
- **Problem**:
  - `data-toggle="dropdown"` requires the Bootstrap jQuery plugin
  - `data-widget="pushmenu"` and `data-widget="treeview"` require AdminLTE JS
- **Impact**: If AdminLTE JS is not loaded in the SPA bundle, the header dropdown menu and sidebar collapse/expand will not work at all.
- **Action**: Verify that AdminLTE JS is included via `./scripts/app` imports. If not, either add it or replace these with React state-managed interactions.
- **Status**: [ ] Open

### M2. `window.blessing` global may not be initialized before access

- **Files**: `resources/assets/src/contexts/AppConfig.tsx:78-79`, `resources/assets/src/index.tsx`
- **Problem**: `AppConfigProvider` sets `window.blessing.extra` and `window.blessing.base_url` after the fetch completes, but `index.tsx` imports `./scripts/app` before rendering `<App>`. If `./scripts/app` or its transitive imports access `window.blessing` synchronously and the object is not pre-defined, a `TypeError: Cannot set properties of undefined` will be thrown.
- **Action**: Confirm that `window.blessing` is pre-initialized as an empty object in `template.html` or an early script. If not, add `window.blessing = window.blessing || {}` at the top of `index.tsx`.
- **Status**: [ ] Open

### M3. OAuth authorization page CSS/JS self-containment

- **File**: `resources/views/auth/base.twig`
- **Problem**: The migration plan states that `auth/base.twig` was updated with CDN CSS/JS links so the backend OAuth authorization page is self-contained. However, in SPA mode webpack outputs assets to `public/app/` and the Twig template may reference old asset paths. Need to verify the OAuth authorization page renders correctly without the webpack manifest.
- **Status**: [ ] Open

### M4. `ResponseBody` type mismatch — admin options save always shows error toast

- **Files**: Multiple frontend admin pages, `app/Http/Controllers/Api/OptionsController.php`
- **Problem**: All admin pages use `fetch.post<fetch.ResponseBody>(...)` and check `code === 0` for success. But `Api\OptionsController`'s save methods return `response()->json(['message' => ...])` (no `code` field). Since `undefined === 0` is `false`, the frontend will display an error toast even on successful saves.
- **Fix**: Either change the backend save methods to use the `json()` helper (which returns `{ code, message }` format), or change the frontend to check the HTTP status code instead.
- **Status**: [ ] Open

### M5. Registration / forgot / reset password — POST targets not proxied

- **Files**: `resources/assets/src/App.tsx`, `routes/web.php`, `edge-functions/api-proxy.js`
- **Problem**: `App.tsx` lazy-loads frontend components for `/auth/register`, `/auth/forgot`, `/auth/reset/:uid`. These components POST to backend web routes (`/auth/register`, `/auth/forgot`, `/auth/reset/{uid}`). Under the SPA + Edge Function architecture, these POST requests will not be proxied (Edge Function only proxies `/api/*` and `/oauth/*`).
- **Fix**: Either migrate these auth operations to `/api/auth/*` API routes, or add `/auth/*` proxy rules to the Edge Function.
- **Status**: [ ] Open

### M6. `urls.ts` — `auth.logout` points to web route `/auth/logout`

- **File**: `resources/assets/src/scripts/urls.ts:27`
- **Problem**: `auth.logout` returns `/auth/logout`, a web route (POST). In SPA mode, logout should only clear local tokens — no backend call needed. `AuthContext.tsx`'s `logout()` already correctly implements local-only logout, but if any legacy code references `urls.auth.logout()` to send a POST request, it will fail (not proxied).
- **Action**: Search for usages of `urls.auth.logout()`. If none exist, this is informational only. If usages exist, replace them with the `useAuth().logout()` call.
- **Status**: [ ] Open

### M7. Missing `/skinlib/upload` route in `App.tsx`

- **File**: `resources/assets/src/App.tsx`
- **Problem**: The original system has a `/skinlib/upload` page, but `App.tsx` does not define this route. Users cannot upload textures through the SPA.
- **Fix**: Add a `/skinlib/upload` route in `App.tsx` pointing to the upload component.
- **Status**: [ ] Open

---

## Low Priority / Code Quality

### L1. `SkinlibLayout.tsx` hardcodes "Guest" username

- **File**: `resources/assets/src/layouts/SkinlibLayout.tsx`
- **Problem**: Always displays "Guest" regardless of authentication state. Should use `useAuth()` to show the actual user's nickname when logged in.
- **Status**: [ ] Open

### L2. `MainLayout.tsx` footer hardcodes version and copyright

- **File**: `resources/assets/src/layouts/MainLayout.tsx`
- **Problem**: Footer shows hardcoded "Version Blessing Skin" and static copyright text. Should use `useAppConfig()` for the dynamic version number and custom copyright text from site options.
- **Status**: [ ] Open

### L3. New admin pages lack i18n

- **Files**: `CustomizationPage.tsx`, `Options.tsx`, `ScoreOptions.tsx`, `Resource.tsx`, `Status.tsx`, `UpdatePage.tsx`
- **Problem**: All label text is hardcoded in English. The `t()` function from `@/scripts/i18n` is not used. The original system supports multiple languages.
- **Status**: [ ] Open

### L4. Missing error handling in `useEffect` fetch calls

- **Files**: Multiple admin and user pages
- **Problem**: Several pages' `useEffect` hooks call `fetch.get(...)` with `.then()` but no `.catch()`. If the API request fails, this results in an unhandled promise rejection.
- **Status**: [ ] Open

### L5. Dockerfile not optimized for SPA deployment

- **File**: `Dockerfile`
- **Problem**: The current Dockerfile builds a traditional PHP + frontend monolith. For the SPA architecture, there should be two separate build artifacts:
  1. Static SPA files (deploy to CDN / EdgeOne Pages)
  2. PHP API server (deploy to CVM)
- **Impact**: The current Dockerfile bundles both together, which does not match the target front-end/back-end separation deployment model.
- **Status**: [ ] Open

---

## Summary

| Category        | Count | Key Items                                                                                              |
| --------------- | ----- | ------------------------------------------------------------------------------------------------------ |
| Critical Bugs   | 3     | Sidebar dead code, token not cleared after password change, token not cleared on account deletion      |
| High Priority   | 6     | AuthLayout unused, admin/super-admin not distinguished, static resource proxy missing, secret key leak |
| Medium Priority | 7     | jQuery dependency, ResponseBody type mismatch, auth routes not proxied                                 |
| Low Priority    | 5     | i18n missing, hardcoded text, Dockerfile not separated                                                 |

### Top 3 most impactful issues:

1. **B1 (Sidebar bug)** — Will directly cause sidebar rendering to break
2. **H6 (Static resource proxy missing)** — Will cause Minecraft clients to fail loading skins
3. **M4 (ResponseBody type mismatch)** — Will cause all admin options save operations to show error toasts
