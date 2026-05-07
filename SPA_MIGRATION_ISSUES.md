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

### L3. New admin pages lack i18n ✅

- **Status**: [x] Fixed
- **Fix**: All 8 pages now use `t()` from `@/scripts/i18n` for all labels and buttons. Keys used: `admin.status.*`, `admin.update.*`, `options.homepage.*`, `options.customJsCss.*`, `options.rate.*`, `options.sign.*`, `options.sharing.*`, `options.report.*`, `options.general.*`, `options.meta.*`, `options.recaptcha.*`, `options.resources.*`, `options.cache.*`, `user.profile.*`, `general.*`.

### L5. Dockerfile not optimized for SPA deployment ✅

- **Status**: [x] Fixed
- **Fix**: Added `Dockerfile.spa` — standalone frontend build that outputs static SPA files to `/app/public/app/` for deployment to EdgeOne Pages CDN. The original `Dockerfile` remains for PHP API backend (CVM).

---

## Summary

| Category        | Total  | Fixed  | Verified | Deferred |
| --------------- | ------ | ------ | -------- | -------- |
| Critical Bugs   | 3      | 3      | 0        | 0        |
| High Priority   | 6      | 6      | 0        | 0        |
| Medium Priority | 7      | 2      | 5        | 0        |
| Low Priority    | 5      | 5      | 0        | 0        |
| **Total**       | **21** | **16** | **5**    | **0**    |

### All 21 issues resolved: 16 fixed + 5 verified as non-issues
