# Blessing Skin Server - SPA Migration Plan

> Updated: 2026-05-08
> Current Status: Phase 1 ~90% / Phase 2 ~70% / Phase 3 ~20%
> Target Architecture: React SPA (EdgeOne Pages CDN) + PHP/Laravel API Backend (CVM)
> Strategy: All frontend API calls migrate to `/api/*` routes (方案 A — 一次做完)
> Last Review: 2026-05-08 — Code Review 完成，发现 4 个高优先级 + 8 个中优先级问题

---

## Architecture Overview

```
Browser --> EdgeOne CDN (serves static React SPA: index.html + JS/CSS)
              |
              +--> Edge Function (proxies /api/*, /oauth/*)
                     |
                     +--> PHP/Laravel API Server (CVM)
                          OAuth2/Passport + PKCE authentication
                          CORS covers api/* and oauth/* only
```

**Core principle**: SPA 的所有数据请求都走 `/api/*` 路径。Edge Function 只代理 `/api/*` 和 `/oauth/*`。后端 web 路由仅用于 OAuth 授权页面的服务端渲染。

---

## Already Completed (第一轮 + 第二轮 + 第三轮已完成)

以下任务已在之前的提交和当前未提交改动中完成：

### 基础设施 & 配置

- [x] OAuth scope 拼写修复 (`ReadWrtie` → `ReadWrite`)
- [x] 8 个缺失 SPA 路由已添加（占位符页面）
- [x] Edge Function CORS 和 OPTIONS preflight 处理
- [x] `DetectLanguagePrefer` 中间件 no-op 修复
- [x] `PrivateRoute` / `AdminRoute` 路由守卫
- [x] `net.ts` token 刷新竞态条件修复
- [x] 自定义 `HandleCors.php` 替换为 Laravel 内置 CORS
- [x] `config/cors.php` 完整配置
- [x] `bootstrap/chkenv.php` `ini_set` 修复
- [x] `Option.php` QueryException 日志记录
- [x] `@types/react` / `@types/react-dom` 升级到 v17
- [x] `FILESYSTEM_DRIVER` → `FILESYSTEM_DISK`
- [x] webpack `output.clean: true`
- [x] `$faker->email` → `$faker->email()`
- [x] `symfony/yaml` `^5.0` → `^6.0`
- [x] `auth/base.twig` 添加 CDN CSS/JS（后端 OAuth 页面自包含）
- [x] 删除死代码：`route.tsx`、`homePage.ts`、`useBlessingExtra.ts`（旧版）、`HtmlWebpackEnhancementPlugin.ts`
- [x] `useBlessingExtra` 迁移到 `AppConfig` context（6 个视图文件）

### Phase 1 后端 — 已完成的 API 路由

- [x] **1.1** Skinlib / Texture API — 8 个端点全部注册到 `routes/api.php`
- [x] **1.2** User Profile / Account API — 7 个端点全部注册
- [x] **1.3** Admin 插件管理 API — 6 个端点全部注册
- [x] **1.4** Admin 翻译管理 API — 4 个端点全部注册
- [x] **1.5** Admin Dashboard & Reports API — 4 个端点全部注册
- [x] **1.6** Admin Options API — 11 个端点全部注册，`Api\OptionsController` 已创建
- [x] **1.7** Admin Update API — 2 个端点全部注册

### Phase 1 后端 — 已完成的控制器修改

- [x] **1.8.1** `UserController@handleProfile` — `Auth::logout()` / `session()->flush()` 在 Bearer token 模式下跳过
- [x] **1.8.2** `UserController@sendVerificationEmail` — session 限流改为 Cache 限流
- [x] **1.8.3** `TranslationsController@create` — 添加 `$request->expectsJson()` 分支返回 JSON
- [x] **1.8.4** `ReportController` — 新增 `trackData()` 方法返回 JSON
- [x] **1.8.5** `AdminController` — 提取 `buildStatusData()`，新增 `statusData()` 返回 JSON
- [x] **1.8.6** `UpdateController` — 新增 `checkUpdate()` 方法返回 JSON

### Phase 2 前端 — 已完成

- [x] **2.1** `urls.ts` 所有 API 路径迁移到 `/api/*` 前缀
- [x] **2.7** Admin Dashboard — 新增 `views/admin/Dashboard.tsx`（占位符）

### Phase 3 — 已完成

- [x] **3.1** `net.ts` — `request.clone()` 在 fetch 之前执行，修复 body 消费后 clone 失败
- [x] **3.2** `config/cors.php` — `supports_credentials` 改为 `false`

### Deferred (推迟)

- **[P2-15]** 替换 `react-hot-loader` → React Fast Refresh — 需要引入 babel-loader + `react-refresh/babel`，改变整个 TS 编译流水线
- **[P2-17]** 更新 Passport 废弃中间件 — `CheckForAnyScope`/`CheckScopes` 在 Passport 11 仍可用，迁移到 `can` 需处理 OR/AND 语义差异

---

## Phase 1: 后端 — 补全 API 路由 (`routes/api.php`) ✅ 基本完成

**目标**: 前端所有数据请求从 web 路由路径迁移到 `/api/*` 路径。

> **状态**: 42 个 API 路由已全部注册，7 个控制器方法已全部修改。剩余工作：`Api\OptionsController` 需添加输入验证（见 Code Review 问题 H4）。

### 1.1 Skinlib / Texture API (8 个端点) ✅

所有 `SkinlibController` 方法已返回 JSON，直接可复用。

| 方法   | API 路径                         | Controller                       | 中间件                              |
| ------ | -------------------------------- | -------------------------------- | ----------------------------------- |
| GET    | `/api/skinlib/list`              | `SkinlibController@library`      | none                                |
| GET    | `/api/skinlib/info/{texture}`    | `SkinlibController@info`         | none                                |
| GET    | `/api/texture/{texture}`         | `SkinlibController@info`         | none                                |
| POST   | `/api/texture`                   | `SkinlibController@handleUpload` | `api`, `auth:web,oauth`, `verified` |
| PUT    | `/api/texture/{texture}/name`    | `SkinlibController@rename`       | `api`, `auth:web,oauth`, `verified` |
| PUT    | `/api/texture/{texture}/type`    | `SkinlibController@type`         | `api`, `auth:web,oauth`, `verified` |
| PUT    | `/api/texture/{texture}/privacy` | `SkinlibController@privacy`      | `api`, `auth:web,oauth`, `verified` |
| DELETE | `/api/texture/{texture}`         | `SkinlibController@delete`       | `api`, `auth:web,oauth`, `verified` |

### 1.2 User Profile / Account API (7 个端点) ✅

| 方法 | API 路径                       | Controller                             | 中间件                  | 注意事项                                                               |
| ---- | ------------------------------ | -------------------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| GET  | `/api/user/score-info`         | `UserController@scoreInfo`             | `api`, `auth:web,oauth` | 直接复用                                                               |
| POST | `/api/user/sign`               | `UserController@sign`                  | `api`, `auth:web,oauth` | 直接复用                                                               |
| POST | `/api/user/profile`            | `UserController@handleProfile`         | `api`, `auth:web,oauth` | 需修改：`Auth::logout()` 和 `session()->flush()` 在 token 模式下需跳过 |
| POST | `/api/user/profile/avatar`     | `UserController@setAvatar`             | `api`, `auth:web,oauth` | 直接复用                                                               |
| POST | `/api/user/email-verification` | `UserController@sendVerificationEmail` | `api`, `auth:web,oauth` | 需修改：限流从 session 改为 Cache                                      |
| PUT  | `/api/user/dark-mode`          | `UserController@toggleDarkMode`        | `api`, `auth:web,oauth` | 直接复用                                                               |
| GET  | `/api/user/closet/ids`         | `ClosetController@allIds`              | `api`, `auth:web,oauth` | 直接复用                                                               |

### 1.3 Admin 插件管理 API (6 个端点) ✅

| 方法 | API 路径                             | Controller                       | 中间件                                      |
| ---- | ------------------------------------ | -------------------------------- | ------------------------------------------- |
| GET  | `/api/admin/plugins/data`            | `PluginController@getPluginData` | `api`, `auth:web,oauth`, `role:admin`       |
| POST | `/api/admin/plugins/manage`          | `PluginController@manage`        | `api`, `auth:web,oauth`, `role:admin`       |
| POST | `/api/admin/plugins/upload`          | `PluginController@upload`        | `api`, `auth:web,oauth`, `role:super-admin` |
| POST | `/api/admin/plugins/wget`            | `PluginController@wget`          | `api`, `auth:web,oauth`, `role:super-admin` |
| GET  | `/api/admin/plugins/market/list`     | `MarketController@marketData`    | `api`, `auth:web,oauth`, `role:admin`       |
| POST | `/api/admin/plugins/market/download` | `MarketController@download`      | `api`, `auth:web,oauth`, `role:admin`       |

### 1.4 Admin 翻译管理 API (4 个端点) ✅

| 方法   | API 路径                 | Controller                      | 中间件                                | 注意事项                                                         |
| ------ | ------------------------ | ------------------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| GET    | `/api/admin/i18n/list`   | `TranslationsController@list`   | `api`, `auth:web,oauth`, `role:admin` | 直接复用                                                         |
| POST   | `/api/admin/i18n`        | `TranslationsController@create` | `api`, `auth:web,oauth`, `role:admin` | 需修改：返回 `json()` 而非 `redirect()`，移除 `session()->put()` |
| PUT    | `/api/admin/i18n/{line}` | `TranslationsController@update` | `api`, `auth:web,oauth`, `role:admin` | 直接复用                                                         |
| DELETE | `/api/admin/i18n/{line}` | `TranslationsController@delete` | `api`, `auth:web,oauth`, `role:admin` | 直接复用                                                         |

### 1.5 Admin Dashboard & Reports API (4 个端点) ✅

| 方法 | API 路径            | Controller                  | 中间件                                | 注意事项                                                                            |
| ---- | ------------------- | --------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| GET  | `/api/admin/chart`  | `AdminController@chartData` | `api`, `auth:web,oauth`, `role:admin` | 直接复用                                                                            |
| GET  | `/api/admin/status` | `AdminController@status`    | `api`, `auth:web,oauth`, `role:admin` | 需新增一个返回 JSON 的方法。现有 `status()` 返回 Blade view，需提取数据为 JSON 响应 |
| POST | `/api/reports`      | `ReportController@submit`   | `api`, `auth:web,oauth`, `verified`   | 直接复用                                                                            |
| GET  | `/api/user/reports` | `ReportController@track`    | `api`, `auth:web,oauth`               | 需新增一个返回 JSON 的方法。现有 `track()` 返回 Blade view                          |

### 1.6 Admin Options API（4 个端点 — 最大重构）✅ 路由已注册，⚠️ 需添加输入验证

当前 `OptionsController` 的 4 个方法使用 `OptionForm` 服务端表单系统，同时处理 GET（渲染表单）和 POST（保存数据），返回 Twig 视图。需要拆分为独立的 JSON API。

#### 1.6.1 `GET /api/admin/options/customize`

返回 `customize` 页面的所有配置：

```json
{
  "homepage": {
    "home_pic_url": "...",
    "favicon_url": "...",
    "transparent_navbar": false,
    "hide_intro": false,
    "fixed_bg": false,
    "copyright_prefer": "0",
    "copyright_text": ""
  },
  "customJsCss": {
    "custom_css": "",
    "custom_js": ""
  },
  "colors": {
    "navbar": ["primary", "secondary", "success", ...],
    "sidebar": ["primary", "warning", "info", ...]
  },
  "extra": {
    "navbar": "primary",
    "sidebar": "dark-primary"
  }
}
```

#### 1.6.2 `POST /api/admin/options/customize`

接受 `/admin/customize` 页面的所有表单提交。需要复制 `OptionForm::handle()` 的 diff 逻辑或直接调用 `Option::set()` 保存所有提交值。

特殊处理：

- `copyright_prefer` → 保存为 `copyright_prefer_{locale}`
- `copyright_text` → 保存为 `copyright_text_{locale}`
- `action=color` → `navbar_color` / `sidebar_color`

#### 1.6.3 `GET /api/admin/options/score` + `POST /api/admin/options/score`

Keys: `score_per_storage`, `private_score_per_storage`, `score_per_closet_item`, `return_score`, `score_per_player`, `user_initial_score`, `reporter_score_modification`, `reporter_reward_score`, `sign_gap_time`, `sign_after_zero`, `score_award_per_texture`, `take_back_scores_after_deletion`, `score_award_per_like`

特殊处理：`sign_score` 是组合字段 — GET 时需要拆分为 `{sign_score_from, sign_score_to}`，POST 时需要合并为 `"from,to"` 字符串。

#### 1.6.4 `GET /api/admin/options/general` + `POST /api/admin/options/general`

Keys: `site_name`, `site_description`, `site_url`, `register_with_player_name`, `require_verification`, `regs_per_ip`, `max_upload_file_size`, `max_texture_width`, `player_name_rule`, `custom_player_name_regexp`, `player_name_length_min`, `player_name_length_max`, `auto_del_invalid_texture`, `allow_downloading_texture`, `status_code_for_private`, `texture_name_regexp`, `content_policy`, `announcement`, `meta_keywords`, `meta_description`, `meta_extras`, `recaptcha_sitekey`, `recaptcha_secretkey`, `recaptcha_invisible`

特殊处理：

- `site_name` → 保存为 `site_name_{locale}`
- `site_description` → 保存为 `site_description_{locale}`
- `content_policy` → 保存为 `content_policy_{locale}`
- `announcement` → 保存为 `announcement_{locale}`
- `site_url` → strip trailing `/` 和 `/index.php`

#### 1.6.5 `GET /api/admin/options/resource` + `POST /api/admin/options/resource`

Keys: `force_ssl`, `auto_detect_asset_url`, `cache_expire_time`, `cdn_address`, `enable_avatar_cache`, `enable_preview_cache`

特殊处理：`cdn_address` — null → 空字符串，strip trailing `/`

#### 1.6.6 `POST /api/admin/options/resource/clear-cache`

清除应用缓存：`Cache::flush()`

### 1.7 Admin Update API (2 个端点) ✅

| 方法 | API 路径                     | Controller                  | 中间件                                      | 注意事项                                                                      |
| ---- | ---------------------------- | --------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| GET  | `/api/admin/update`          | 新建方法返回更新信息 JSON   | `api`, `auth:web,oauth`, `role:super-admin` | 现有 `showUpdatePage()` 返回 Blade view。需提取 `getUpdateInfo()` 数据为 JSON |
| POST | `/api/admin/update/download` | `UpdateController@download` | `api`, `auth:web,oauth`, `role:super-admin` | 直接复用                                                                      |

### 1.8 需要修改的控制器方法 ✅ 全部完成

| Controller               | 方法                    | 修改内容                                                                                                    |
| ------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `UserController`         | `handleProfile`         | 检测 guard 是否为 `oauth`，如果是则跳过 `Auth::logout()` 和 `session()->flush()`，改为撤销 token            |
| `UserController`         | `sendVerificationEmail` | 将 session 限流 (`session('last_mail_time')`) 改为 Cache 限流 (`Cache::get/set('last_mail_time:'.$userId)`) |
| `TranslationsController` | `create`                | 移除 `$request->session()->put()` 和 `redirect()`，改为 `return json(...)`                                  |
| `ReportController`       | `track`                 | 新增一个返回 JSON 的方法（复用现有查询逻辑）                                                                |
| `AdminController`        | `status`                | 新增一个返回 JSON 的方法，提取现有 `with()` 中的数据为数组                                                  |
| `UpdateController`       | `showUpdatePage`        | 新增一个 `getUpdateInfoAPI()` 方法返回 JSON                                                                 |

### 1.9 后端改动总结

| 类别                           | 新增 API 路由                       | 需修改的控制器方法                                                           |
| ------------------------------ | ----------------------------------- | ---------------------------------------------------------------------------- |
| Skinlib/Texture                | 8                                   | 0（全部直接复用）                                                            |
| User Profile                   | 7                                   | 2 (`handleProfile`, `sendVerificationEmail`)                                 |
| Admin Plugins                  | 6                                   | 0                                                                            |
| Admin Translations             | 4                                   | 1 (`create`)                                                                 |
| Admin Dashboard/Reports/Status | 4                                   | 3 (`track` 新增 JSON 方法, `status` 新增 JSON 方法, `getUpdateInfoAPI` 新增) |
| Admin Options                  | 11 (5 GET + 5 POST + 1 clear-cache) | 需新建 `Api\OptionsController`                                               |
| Admin Update                   | 2                                   | 1 (`getUpdateInfoAPI` 新增)                                                  |
| **合计**                       | **42**                              | **7**                                                                        |

---

## Phase 2: 前端 — 迁移所有 API 调用到 `/api/*` 路径 (进行中 ~70%)

### 2.1 修改 `resources/assets/src/scripts/urls.ts` ✅

所有路径添加 `/api` 前缀，并调整路径结构以匹配 API 路由：

```
skinlib.home:   '/skinlib'           → '/api/skinlib/list'
skinlib.list:   '/skinlib/list'      → '/api/skinlib/list'
skinlib.info:   '/skinlib/info/{id}' → '/api/skinlib/info/{id}'
skinlib.show:   '/skinlib/show/{id}' → (不变，这是页面路由)
texture.*:      '/texture/...'       → '/api/texture/...'
user.closet.*:  '/user/closet/...'   → '/api/user/closet/...'
user.player.*:  '/user/player/...'   → '/api/players/...'
user.score:     '/user/score-info'   → '/api/user/score-info'
user.sign:      '/user/sign'         → '/api/user/sign'
user.profile:   '/user/profile/...'  → '/api/user/profile/...'
admin.*:        '/admin/...'         → '/api/admin/...'
```

### 2.2 修改硬编码 API 路径的视图文件 (待完成)

以下文件包含不在 `urls.ts` 中的硬编码路径，需手动修改：

| 文件                                         | 当前路径                        | 改为                                         |
| -------------------------------------------- | ------------------------------- | -------------------------------------------- |
| `views/auth/Login.tsx`                       | OAuth 重定向，无需改            | —                                            |
| `views/auth/Registration.tsx`                | `/auth/register`                | 不变（auth 不走 `/api/*`，走后端 web 路由）  |
| `views/auth/Forgot.tsx`                      | `/auth/forgot`                  | 不变（同上）                                 |
| `views/auth/Reset.tsx`                       | `/auth/reset/{uid}`             | 不变（同上）                                 |
| `views/skinlib/Show/index.tsx:46`            | `location.href.replace(...)`    | 改为 `get<Texture>(\`/api/texture/${tid}\`)` |
| `views/skinlib/Show/index.tsx:169`           | `/skinlib/report`               | `/api/reports`                               |
| `views/user/Players/ModalAddPlayer.tsx`      | `urls.user.player.add()`        | 由 urls.ts 统一改                            |
| `views/user/OAuth/index.tsx`                 | `/oauth/clients`                | 不变（OAuth 操作不走 `/api/*`）              |
| `views/user/Dashboard/index.tsx:62`          | `urls.user.score()`             | 由 urls.ts 统一改                            |
| `views/user/Dashboard/index.tsx:79`          | `urls.user.sign()`              | 由 urls.ts 统一改                            |
| `views/user/Dashboard/EmailVerification.tsx` | `/user/email-verification`      | `/api/user/email-verification`               |
| `views/admin/Dashboard.ts`                   | `/admin/chart`                  | `/api/admin/chart`                           |
| `views/admin/PluginsManagement`              | `/admin/plugins/data` 等        | `/api/admin/plugins/...`                     |
| `views/admin/PluginsMarket`                  | `/admin/plugins/market/list` 等 | `/api/admin/plugins/market/...`              |
| `views/admin/Translations`                   | `/admin/i18n/list` 等           | `/api/admin/i18n/...`                        |
| `views/admin/UpdatePage.tsx`                 | 需调用新 API                    | `/api/admin/update`                          |

### 2.3 修改 `HomeController::siteConfig()` 返回 `extra` 数据 (待完成)

当前 `siteConfig()` 只返回 `siteName`, `locale`, `version`。`useBlessingExtra` hook 依赖 `extra` 字段。

**需要添加的 extra 字段**（从 `#blessing-extra` 服务端注入迁移过来）：

```php
'extra' => [
    // skinlib/Show 页面
    'nickname' => auth()->user()?->nickname,
    'uploaderExists' => ...,
    'currentUid' => auth()->id(),
    'admin' => auth()->user()?->isAdmin(),
    'badges' => [],
    'download' => (bool) option('allow_downloading_texture'),
    'report' => (int) option('reporter_score_modification'),

    // Captcha
    'recaptcha' => option('recaptcha_sitekey'),
    'invisible' => option('recaptcha_invisible'),

    // 注册/忘记密码页面
    'regs_per_ip' => option('regs_per_ip'),
    'register_with_player_name' => option('register_with_player_name'),
]
```

注意：部分 `extra` 数据是页面特定的（如 `inCloset`、`score/cost/rule`），不应全部放在 global site-config 中。需要为每个页面提供单独的配置 API，或在页面组件中自行请求。

### 2.4 修复 `Show/index.tsx` 的 URL 解析 (待完成)

```typescript
// 旧代码（依赖 blessing.base_url）：
const url = location.href
  .replace(blessing.base_url, '')
  .replace('skinlib/show', 'texture')
const texture = await fetch.get<Texture>(url)

// 新代码（从路由参数获取 tid，直接调 API）：
import { useParams } from 'react-router-dom'
const { id } = useParams<{ id: string }>()
const texture = await fetch.get<Texture>(`/api/texture/${id}`)
```

### 2.5 修复 `useMount('#previewer')` 崩溃 (待完成)

`previewer` DOM 元素在 SPA 中不存在。改为内联渲染：

- 选项 A：在 `MainLayout` 中添加 `#previewer` div
- 选项 B：在用到 viewer 的组件中直接渲染 `<Viewer>` 而不是通过 portal

推荐选项 B，更符合 React 组件化原则。

### 2.6 修复 `blessing.extra` 直接访问 (待完成)

以下文件直接访问 `blessing.extra`，需改为 `useBlessingExtra` 或从 API 获取：

| 文件                                       | 当前代码                             | 修复方式                                                   |
| ------------------------------------------ | ------------------------------------ | ---------------------------------------------------------- |
| `views/skinlib/Show/index.tsx:57`          | `blessing.extra.inCloset`            | 改用 API：`GET /api/user/closet/ids` 检查 tid 是否在列表中 |
| `components/Captcha.tsx:26-27`             | `blessing.extra.recaptcha/invisible` | 改用 `useBlessingExtra`                                    |
| `views/user/Players/ModalAddPlayer.tsx:50` | `blessing.extra as Extra`            | 改用 `useBlessingExtra` 或新增 `/api/user/player/config`   |
| `views/admin/Customization.ts:43,81`       | `blessing.extra.navbar/sidebar`      | 改用 API `GET /api/admin/options/customize`                |

### 2.7 修复 Admin Dashboard 复用 User Dashboard ✅

`App.tsx` 中 `/admin` 和 `/user` 都渲染 `<Dashboard />`（`views/user/Dashboard`）。需要新增 `views/admin/Dashboard.tsx` 组件，或导入现有的 `views/admin/Dashboard.ts`（需改为 SPA 兼容）。

---

## Phase 3: 修复剩余问题 (进行中 ~20%)

### 3.1 `net.ts` 中 `request.clone()` 在 body 消费后调用 ✅

- **文件**: `resources/assets/src/scripts/net.ts:144`
- **问题**: token 刷新后重试时，`request.clone()` 在原始 fetch（line 111）之后调用。如果原始请求有 body（POST/PUT），body 已被消费，clone 会抛出 `TypeError: Failed to execute 'clone' on 'Request': Request body is already used`。
- **修复**: 在第一次 `fetch(request)` 之前就 clone request：

```typescript
// 在 fetch 之前保存 clone
const retryClone = request.clone()

// ... 在 401 处理中：
retryRequest.headers.set('Authorization', `Bearer ${newToken}`)
return walkFetch(retryClone) // 使用事先 clone 的 request
```

### 3.2 `supports_credentials: true` 与 `allowed_origins: ['*']` 冲突 ✅

- **文件**: `config/cors.php`
- **问题**: CORS 规范不允许 `Access-Control-Allow-Origin: *` 与 `Access-Control-Allow-Credentials: true` 同时使用。
- **修复**: 由于 `net.ts` 使用 `credentials: 'omit'`，将 `supports_credentials` 改为 `false`，或直接删除该行。

### 3.3 8 个新页面组件仍是占位符 (待完成)

`ProfilePage.tsx`、`Reports.tsx`、`CustomizationPage.tsx`、`ScoreOptions.tsx`、`Options.tsx`、`Resource.tsx`、`Status.tsx`、`UpdatePage.tsx` 只有空 card，需要实现完整功能。

### 3.4 旧的 DOM 操作脚本仍在执行 (待完成)

`scripts/app.ts` 导入 `extra.ts`、`notification.tsx`、`emailVerification.tsx`、`logout.ts`、`darkMode.tsx`。在 SPA 模式下这些查找不存在的 DOM 元素，虽然有空值保护，但是无用代码。可以在 `index.tsx` 中条件导入或重构为 React 组件。

### 3.5 `$faker->name` 属性访问 (待完成)

- **文件**: `database/factories/UserFactory.php:17`
- `$this->faker->name` 应改为 `$this->faker->name()`，与 `email` 的修复保持一致。

---

## Code Review 发现的问题 (2026-05-08)

### 严重问题 (High Priority)

#### H1. Edge Function CORS 头与后端不一致

- **文件**: `edge-functions/api-proxy.js:48`, `config/cors.php`
- **问题**: Edge Function 设置了 `Access-Control-Allow-Credentials: true`，但 `config/cors.php` 已改为 `supports_credentials: false`，且 `net.ts` 使用 `credentials: 'omit'`。Edge Function 返回 `Allow-Credentials: true` + `Allow-Origin: *` 在某些浏览器下可能被拒绝（CORS 规范不允许此组合）。
- **修复**: 移除 Edge Function 中所有 `Access-Control-Allow-Credentials: true` 行（共 2 处：`/api/*` 代理和 `/oauth/*` 代理）。

#### H2. `.env.spa.example` 暴露 `REACT_APP_OAUTH_CLIENT_SECRET`

- **文件**: `.env.spa.example`
- **问题**: PKCE 流程不需要 `client_secret`。保留此变量会误导开发者在前端代码中嵌入 secret。`AuthService.ts` 的 token 交换实际上未发送 secret，说明此变量是残留。
- **修复**: 从 `.env.spa.example` 中删除 `REACT_APP_OAUTH_CLIENT_SECRET` 行。

#### H3. Token 过期后请求可能不触发刷新逻辑

- **文件**: `resources/assets/src/auth/tokenStore.ts:28`, `resources/assets/src/scripts/net.ts:34`
- **问题**: `getAccessToken()` 在 token 过期后返回 `null`，导致 `retrieveToken()` 不设置 Authorization 头。请求无 Bearer token 发出后，后端可能返回 redirect（302）而非 401，使得 `net.ts` 的 token 刷新逻辑不触发。
- **修复方案**:
  - 方案 A（推荐）：在 `walkFetch` 开头添加 proactive refresh — 如果 access token 已过期但 refresh token 存在，先刷新再发请求。
  - 方案 B：修改 `getAccessToken()` 使其在过期时仍返回 token（让后端返回 401），但这会增加一次无效请求。

```typescript
// 方案 A 示例 — 在 walkFetch 开头添加：
if (!getAccessToken() && getRefreshToken()) {
  if (!isRefreshing) {
    isRefreshing = true
    refreshPromise = refreshAccessToken().finally(() => {
      isRefreshing = false
    })
  }
  await refreshPromise
}
```

#### H4. `Api\OptionsController` 缺少输入验证

- **文件**: `app/Http/Controllers/Api/OptionsController.php`
- **问题**: `saveCustomize()`, `saveScore()`, `saveGeneral()`, `saveResource()` 直接使用 `$request->input()` 写入数据库，无任何 `$request->validate()` 调用。恶意管理员可注入任意类型的值。
- **修复**: 为每个 save 方法添加验证规则。示例：

```php
// saveScore() 应添加：
$request->validate([
    'score_per_storage' => 'nullable|integer|min:0',
    'private_score_per_storage' => 'nullable|integer|min:0',
    'score_per_closet_item' => 'nullable|integer|min:0',
    'return_score' => 'nullable|boolean',
    'score_per_player' => 'nullable|integer|min:0',
    'user_initial_score' => 'nullable|integer|min:0',
    'sign_score_from' => 'nullable|integer|min:0',
    'sign_score_to' => 'nullable|integer|min:0',
    'sign_gap_time' => 'nullable|integer|min:0',
    // ... 其余字段
]);
```

### 中等问题 (Medium Priority)

#### M1. `score()` 方法使用 `@` 错误抑制符

- **文件**: `app/Http/Controllers/Api/OptionsController.php:87`
- **当前**: `$signScore = @explode(',', option('sign_score'));`
- **修复**: `$signScore = explode(',', option('sign_score') ?? '');`

#### M2. `SkinlibLayout.tsx` 已创建但未使用

- **文件**: `resources/assets/src/layouts/SkinlibLayout.tsx`
- **问题**: `App.tsx` 中 skinlib 路由使用 `MainLayout`，`SkinlibLayout` 完全未被引用。
- **决策**: 要么在 skinlib 路由中使用它，要么删除。

#### M3. `AuthLayout.tsx` 已创建但未使用

- **文件**: `resources/assets/src/layouts/AuthLayout.tsx`
- **问题**: `App.tsx` 中 auth 路由（register/forgot/reset）使用 `MainLayout`，Login 直接渲染组件。AdminLTE 的 `login-box` 布局更适合 auth 页面。
- **决策**: auth 页面应使用 `AuthLayout` 而非 `MainLayout`。

#### M4. `AdminRoute` 权限检查不区分 admin / super-admin

- **文件**: `resources/assets/src/components/Guards.tsx:37`
- **问题**: `AdminRoute` 只检查 `user?.admin`，但原系统有 `admin` 和 `super-admin` 两级权限。某些路由（update、plugin upload）需要 `super-admin`，前端没有区分。
- **修复**: 在 `UserInfo` 中添加 `permission` 字段（数值），`AdminRoute` 支持可选 `requiredPermission` 参数。

#### M5. `AppConfig` 中直接修改 `window.blessing` 全局变量

- **文件**: `resources/assets/src/contexts/AppConfig.tsx:78-79`
- **问题**: 设置 `(window as any).blessing.extra` 和 `blessing.base_url` 是为了兼容旧代码，但在 SPA 中应逐步移除。
- **处理**: 标记为技术债务，在所有 `blessing.extra` 引用迁移完成后清理。

#### M6. Header 下拉菜单依赖 Bootstrap jQuery 插件

- **文件**: `resources/assets/src/layouts/Header.tsx:25`
- **问题**: `data-toggle="dropdown"` 需要 Bootstrap jQuery 插件。SPA 中可能未加载 jQuery/Bootstrap JS。
- **修复**: 使用 React 状态管理下拉菜单的展开/收起，或确保 AdminLTE JS 在 SPA 入口中已加载。

#### M7. Sidebar 的 AdminLTE widget 属性依赖 JS

- **文件**: `resources/assets/src/layouts/Header.tsx:13`, `Sidebar.tsx:140`
- **问题**: `data-widget="pushmenu"` 和 `data-widget="treeview"` 需要 AdminLTE JS。
- **修复**: 同 M6，需确认 AdminLTE JS 在 SPA 模式下的加载方式，或用 React 状态替代。

#### M8. `walkFetch` 递归重试无次数限制

- **文件**: `resources/assets/src/scripts/net.ts`
- **问题**: token 刷新成功但新 token 仍无效时（如被服务端撤销），会进入无限递归。
- **修复**: 添加重试计数器，最多重试 1 次：

```typescript
export async function walkFetch(
  request: Request,
  retryCount = 0,
): Promise<any> {
  // ... 在 401 处理中：
  if (retryCount >= 1) {
    clearToken()
    // 显示登出提示
    return
  }
  return walkFetch(retryClone, retryCount + 1)
}
```

### 低优先级问题 (Low Priority)

#### L1. `Dashboard.tsx` (admin) 只是占位符

- 仅显示一个 alert 框，需实现完整的 admin dashboard 功能（图表、统计等）。
- 已在 Phase 3.3 中跟踪。

#### L2. Sidebar `NavLink` 对根路径过度匹配

- **文件**: `resources/assets/src/layouts/Sidebar.tsx`
- **问题**: `/user` 路径的 NavLink 会在 `/user/closet` 等子路径下也高亮。
- **修复**: 对 Dashboard 等根路径的 `NavLink` 添加 `exact` 属性。

#### L3. `Callback.tsx` 中 Promise 未处理 rejection

- **文件**: `resources/assets/src/views/auth/Callback.tsx:29`
- **问题**: `.then()` 没有 `.catch()`，异常会导致 unhandled promise rejection。
- **修复**: 添加 `.catch((e) => setError(e.message || 'Unexpected error'))`。

#### L4. `template.html` 缺少动态 title

- **文件**: `resources/assets/template.html`
- **问题**: title 硬编码为 "Blessing Skin"，应从 site config 动态设置。
- **修复**: 在 `AppConfigProvider` 加载完成后用 `document.title` 动态更新。

#### L5. `UserController::sendVerificationEmail` 中 `$user` 被获取两次

- **文件**: `app/Http/Controllers/UserController.php`
- **问题**: 方法内两次调用 `Auth::user()`，第二次多余。
- **修复**: 删除第二次 `$user = Auth::user();`。

---

## 执行顺序（已更新）

| 顺序 | 内容                                                              | 状态      | 依赖    |
| ---- | ----------------------------------------------------------------- | --------- | ------- |
| 1    | Phase 1.1-1.7: API 路由注册                                       | ✅ 完成   | 无      |
| 2    | Phase 1.8: 控制器方法修改                                         | ✅ 完成   | 步骤 1  |
| 3    | Phase 2.1: `urls.ts` 迁移                                         | ✅ 完成   | 步骤 1  |
| 4    | Phase 2.7: Admin Dashboard 组件                                   | ✅ 完成   | 步骤 2  |
| 5    | Phase 3.1-3.2: CORS 和 net.ts clone 修复                          | ✅ 完成   | 步骤 3  |
| 6    | **H4: `OptionsController` 添加输入验证**                          | ⚠️ 待修复 | 步骤 2  |
| 7    | **H1: Edge Function CORS 头修复**                                 | ⚠️ 待修复 | 无      |
| 8    | **H2: 删除 `.env.spa.example` 中的 client_secret**                | ⚠️ 待修复 | 无      |
| 9    | **H3: Proactive token refresh**                                   | ⚠️ 待修复 | 无      |
| 10   | **M8: `walkFetch` 添加重试限制**                                  | ⚠️ 待修复 | 步骤 9  |
| 11   | **M6/M7: AdminLTE JS 在 SPA 中的加载方式**                        | ⚠️ 待修复 | 无      |
| 12   | Phase 2.2: 硬编码 API 路径迁移                                    | 🔲 待完成 | 步骤 3  |
| 13   | Phase 2.3: `siteConfig()` 返回 `extra` 数据                       | 🔲 待完成 | 步骤 12 |
| 14   | Phase 2.4-2.6: Show 页面 URL 解析、previewer、blessing.extra 修复 | 🔲 待完成 | 步骤 13 |
| 15   | Phase 3.3: 8 个占位符页面实现完整功能                             | 🔲 待完成 | 步骤 14 |
| 16   | Phase 3.4: 旧 DOM 操作脚本清理                                    | 🔲 待完成 | 步骤 15 |
| 17   | Phase 3.5: `$faker->name` 修复                                    | 🔲 待完成 | 无      |
| 18   | M2/M3: 清理未使用的 Layout 组件                                   | 🔲 待完成 | 步骤 14 |
| 19   | M4: AdminRoute 支持 super-admin 权限区分                          | 🔲 待完成 | 步骤 15 |
| 20   | L2-L5: 低优先级修复                                               | 🔲 待完成 | 步骤 15 |
| 21   | 端到端测试                                                        | 🔲 待完成 | 全部    |

---

## 进度总览

| 阶段                   | 完成度 | 说明                                                   |
| ---------------------- | ------ | ------------------------------------------------------ |
| Phase 1: 后端 API 路由 | ~90%   | 42 个路由已注册，7 个控制器已改。待修：输入验证        |
| Phase 2: 前端 URL 迁移 | ~70%   | urls.ts 已完成。待做：硬编码路径、extra 数据、组件修复 |
| Phase 3: 修复剩余问题  | ~20%   | CORS 和 clone 已修。待做：占位符页面、DOM 脚本清理     |
| Code Review 问题修复   | 0%     | 4 High + 8 Medium + 5 Low 待修复                       |
| 端到端测试             | 0%     | 16 项测试检查待执行                                    |

---

## Testing Checklist

部署前验证：

### 认证 & 权限

- [ ] OAuth 登录流程端到端可用（SPA → backend login → authorize → callback → token）
- [ ] Token 过期后自动刷新（包括 proactive refresh 场景）
- [ ] Token 刷新失败后正确登出（不进入无限重试）
- [ ] 未登录用户访问 `/user/*` 和 `/admin/*` 被重定向到 `/auth/login`
- [ ] 非 admin 用户访问 `/admin/*` 显示权限拒绝
- [ ] super-admin 专属操作（update、plugin upload）对普通 admin 不可用

### 核心功能

- [ ] Skin Library 浏览无需认证
- [ ] Skin 上传支持 OAuth token
- [ ] Player CRUD 操作可用
- [ ] Closet 收藏/取消可用
- [ ] 所有侧边栏链接指向正确的工作页面
- [ ] i18n 翻译在 SPA 中正确加载

### Admin Options API

- [ ] Admin Options 页面的 GET/POST API 能正确读写所有配置项
- [ ] Admin Options 的 locale-suffixed 键正确保存
- [ ] Admin Options 的输入验证拒绝非法值

### 基础设施

- [ ] Edge Function 正确代理所有 `/api/*` 和 `/oauth/*` 请求
- [ ] CORS preflight 请求对所有端点成功
- [ ] Edge Function CORS 头不包含 `Allow-Credentials: true`（与后端一致）
- [ ] 401 响应触发 token 刷新而非立即登出
- [ ] 后端 OAuth 授权页面（Twig 模板）在无 webpack 资源的情况下正常渲染

### UI / UX

- [ ] Header 下拉菜单正常展开/收起
- [ ] Sidebar 折叠/展开和子菜单正常工作
- [ ] Sidebar 当前页面高亮正确（根路径不过度匹配）
- [ ] 页面 title 动态更新为站点名称
