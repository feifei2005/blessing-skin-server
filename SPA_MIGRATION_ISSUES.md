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

### H2. `SkinlibLayout.tsx` created but unused ✅

- **Status**: [x] Fixed
- **Fix**: `App.tsx` skinlib routes now use `SkinlibLayout` instead of `MainLayout`. SkinlibLayout was already upgraded with `useAuth()` and React Router `<Link>`.

### H3. `AdminRoute` does not distinguish admin vs super-admin ✅

- **Status**: [x] Fixed
- **Fix**: Added `permission` field to `UserInfo` interface. `AdminRoute` now accepts `requiredPermission` prop (defaults to 1=admin). `/admin/update` route uses `requiredPermission={2}` for super-admin protection.

### L3. New admin pages lack i18n ⚠️ Deferred

- **Status**: [ ] Open
- **Fix**: Requires confirming translation keys and adding `t()` calls across 8 pages. Deferred as low-priority polish.

### L4. Missing error handling in `useEffect` fetch calls ✅

- **Status**: [x] Fixed
- **Fix**: All 8 pages now validate API response shape before setting state. Each `.then()` callback checks for a distinguishing property (e.g., `d.detail`, `d.labels`, `d.site_name`, `d.data`) and only sets state if the response has the expected structure. Error-single objects (with `code: -1`) won't pass the shape check, causing the existing null-guard UI to display.

### L5. Dockerfile not optimized for SPA deployment ⚠️ Deferred

- **Status**: [ ] Open
- **Reason**: Current Dockerfile builds PHP + frontend as monolith. For the SPA architecture separation, should have two Dockerfiles or a multi-stage build. This is a deployment/infra concern, not a code change.

---

## Summary

| Category        | Total  | Fixed  | Verified | Deferred |
| --------------- | ------ | ------ | -------- | -------- |
| Critical Bugs   | 3      | 3      | 0        | 0        |
| High Priority   | 6      | 6      | 0        | 0        |
| Medium Priority | 7      | 2      | 5        | 0        |
| Low Priority    | 5      | 3      | 0        | 2        |
| **Total**       | **21** | **14** | **5**    | **2**    |

### Effectively resolved: 19/21 (14 fixed + 5 verified as non-issues)

### Deferred (2):

| ID  | Reason                                                 |
| --- | ------------------------------------------------------ |
| L3  | Admin page i18n — 8 pages, needs translation key audit |
| L5  | Dockerfile separation — deployment/infra concern       |
