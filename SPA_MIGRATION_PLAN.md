# Blessing Skin Server - SPA Migration Plan

> Updated: 2026-05-08
> Current Status: Phase 1 in progress — backend API routes
> Target Architecture: React SPA (EdgeOne Pages CDN) + PHP/Laravel API Backend (CVM)
> Strategy: All frontend API calls migrate to `/api/*` routes (方案 A — 一次做完)

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

## Already Completed (第一轮 + 第二轮已完成)

以下任务已在之前的提交和当前未提交改动中完成：

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

### Deferred (推迟)

- **[P2-15]** 替换 `react-hot-loader` → React Fast Refresh — 需要引入 babel-loader + `react-refresh/babel`，改变整个 TS 编译流水线
- **[P2-17]** 更新 Passport 废弃中间件 — `CheckForAnyScope`/`CheckScopes` 在 Passport 11 仍可用，迁移到 `can` 需处理 OR/AND 语义差异

---

## Phase 1: 后端 — 补全 API 路由 (`routes/api.php`)

**目标**: 前端所有数据请求从 web 路由路径迁移到 `/api/*` 路径。

### 1.1 Skinlib / Texture API (8 个端点)

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

### 1.2 User Profile / Account API (7 个端点)

| 方法 | API 路径                       | Controller                             | 中间件                  | 注意事项                                                               |
| ---- | ------------------------------ | -------------------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| GET  | `/api/user/score-info`         | `UserController@scoreInfo`             | `api`, `auth:web,oauth` | 直接复用                                                               |
| POST | `/api/user/sign`               | `UserController@sign`                  | `api`, `auth:web,oauth` | 直接复用                                                               |
| POST | `/api/user/profile`            | `UserController@handleProfile`         | `api`, `auth:web,oauth` | 需修改：`Auth::logout()` 和 `session()->flush()` 在 token 模式下需跳过 |
| POST | `/api/user/profile/avatar`     | `UserController@setAvatar`             | `api`, `auth:web,oauth` | 直接复用                                                               |
| POST | `/api/user/email-verification` | `UserController@sendVerificationEmail` | `api`, `auth:web,oauth` | 需修改：限流从 session 改为 Cache                                      |
| PUT  | `/api/user/dark-mode`          | `UserController@toggleDarkMode`        | `api`, `auth:web,oauth` | 直接复用                                                               |
| GET  | `/api/user/closet/ids`         | `ClosetController@allIds`              | `api`, `auth:web,oauth` | 直接复用                                                               |

### 1.3 Admin 插件管理 API (6 个端点)

| 方法 | API 路径                             | Controller                       | 中间件                                      |
| ---- | ------------------------------------ | -------------------------------- | ------------------------------------------- |
| GET  | `/api/admin/plugins/data`            | `PluginController@getPluginData` | `api`, `auth:web,oauth`, `role:admin`       |
| POST | `/api/admin/plugins/manage`          | `PluginController@manage`        | `api`, `auth:web,oauth`, `role:admin`       |
| POST | `/api/admin/plugins/upload`          | `PluginController@upload`        | `api`, `auth:web,oauth`, `role:super-admin` |
| POST | `/api/admin/plugins/wget`            | `PluginController@wget`          | `api`, `auth:web,oauth`, `role:super-admin` |
| GET  | `/api/admin/plugins/market/list`     | `MarketController@marketData`    | `api`, `auth:web,oauth`, `role:admin`       |
| POST | `/api/admin/plugins/market/download` | `MarketController@download`      | `api`, `auth:web,oauth`, `role:admin`       |

### 1.4 Admin 翻译管理 API (4 个端点)

| 方法   | API 路径                 | Controller                      | 中间件                                | 注意事项                                                         |
| ------ | ------------------------ | ------------------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| GET    | `/api/admin/i18n/list`   | `TranslationsController@list`   | `api`, `auth:web,oauth`, `role:admin` | 直接复用                                                         |
| POST   | `/api/admin/i18n`        | `TranslationsController@create` | `api`, `auth:web,oauth`, `role:admin` | 需修改：返回 `json()` 而非 `redirect()`，移除 `session()->put()` |
| PUT    | `/api/admin/i18n/{line}` | `TranslationsController@update` | `api`, `auth:web,oauth`, `role:admin` | 直接复用                                                         |
| DELETE | `/api/admin/i18n/{line}` | `TranslationsController@delete` | `api`, `auth:web,oauth`, `role:admin` | 直接复用                                                         |

### 1.5 Admin Dashboard & Reports API (4 个端点)

| 方法 | API 路径            | Controller                  | 中间件                                | 注意事项                                                                            |
| ---- | ------------------- | --------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| GET  | `/api/admin/chart`  | `AdminController@chartData` | `api`, `auth:web,oauth`, `role:admin` | 直接复用                                                                            |
| GET  | `/api/admin/status` | `AdminController@status`    | `api`, `auth:web,oauth`, `role:admin` | 需新增一个返回 JSON 的方法。现有 `status()` 返回 Blade view，需提取数据为 JSON 响应 |
| POST | `/api/reports`      | `ReportController@submit`   | `api`, `auth:web,oauth`, `verified`   | 直接复用                                                                            |
| GET  | `/api/user/reports` | `ReportController@track`    | `api`, `auth:web,oauth`               | 需新增一个返回 JSON 的方法。现有 `track()` 返回 Blade view                          |

### 1.6 Admin Options API（4 个端点 — 最大重构）

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

### 1.7 Admin Update API (2 个端点)

| 方法 | API 路径                     | Controller                  | 中间件                                      | 注意事项                                                                      |
| ---- | ---------------------------- | --------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| GET  | `/api/admin/update`          | 新建方法返回更新信息 JSON   | `api`, `auth:web,oauth`, `role:super-admin` | 现有 `showUpdatePage()` 返回 Blade view。需提取 `getUpdateInfo()` 数据为 JSON |
| POST | `/api/admin/update/download` | `UpdateController@download` | `api`, `auth:web,oauth`, `role:super-admin` | 直接复用                                                                      |

### 1.8 需要修改的控制器方法

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

## Phase 2: 前端 — 迁移所有 API 调用到 `/api/*` 路径

### 2.1 修改 `resources/assets/src/scripts/urls.ts`

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

### 2.2 修改硬编码 API 路径的视图文件

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

### 2.3 修改 `HomeController::siteConfig()` 返回 `extra` 数据

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

### 2.4 修复 `Show/index.tsx` 的 URL 解析

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

### 2.5 修复 `useMount('#previewer')` 崩溃

`previewer` DOM 元素在 SPA 中不存在。改为内联渲染：

- 选项 A：在 `MainLayout` 中添加 `#previewer` div
- 选项 B：在用到 viewer 的组件中直接渲染 `<Viewer>` 而不是通过 portal

推荐选项 B，更符合 React 组件化原则。

### 2.6 修复 `blessing.extra` 直接访问

以下文件直接访问 `blessing.extra`，需改为 `useBlessingExtra` 或从 API 获取：

| 文件                                       | 当前代码                             | 修复方式                                                   |
| ------------------------------------------ | ------------------------------------ | ---------------------------------------------------------- |
| `views/skinlib/Show/index.tsx:57`          | `blessing.extra.inCloset`            | 改用 API：`GET /api/user/closet/ids` 检查 tid 是否在列表中 |
| `components/Captcha.tsx:26-27`             | `blessing.extra.recaptcha/invisible` | 改用 `useBlessingExtra`                                    |
| `views/user/Players/ModalAddPlayer.tsx:50` | `blessing.extra as Extra`            | 改用 `useBlessingExtra` 或新增 `/api/user/player/config`   |
| `views/admin/Customization.ts:43,81`       | `blessing.extra.navbar/sidebar`      | 改用 API `GET /api/admin/options/customize`                |

### 2.7 修复 Admin Dashboard 复用 User Dashboard

`App.tsx` 中 `/admin` 和 `/user` 都渲染 `<Dashboard />`（`views/user/Dashboard`）。需要新增 `views/admin/Dashboard.tsx` 组件，或导入现有的 `views/admin/Dashboard.ts`（需改为 SPA 兼容）。

---

## Phase 3: 修复剩余问题

### 3.1 `net.ts` 中 `request.clone()` 在 body 消费后调用

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

### 3.2 `supports_credentials: true` 与 `allowed_origins: ['*']` 冲突

- **文件**: `config/cors.php`
- **问题**: CORS 规范不允许 `Access-Control-Allow-Origin: *` 与 `Access-Control-Allow-Credentials: true` 同时使用。
- **修复**: 由于 `net.ts` 使用 `credentials: 'omit'`，将 `supports_credentials` 改为 `false`，或直接删除该行。

### 3.3 8 个新页面组件仍是占位符

`ProfilePage.tsx`、`Reports.tsx`、`CustomizationPage.tsx`、`ScoreOptions.tsx`、`Options.tsx`、`Resource.tsx`、`Status.tsx`、`UpdatePage.tsx` 只有空 card，需要实现完整功能。

### 3.4 旧的 DOM 操作脚本仍在执行

`scripts/app.ts` 导入 `extra.ts`、`notification.tsx`、`emailVerification.tsx`、`logout.ts`、`darkMode.tsx`。在 SPA 模式下这些查找不存在的 DOM 元素，虽然有空值保护，但是无用代码。可以在 `index.tsx` 中条件导入或重构为 React 组件。

### 3.5 `$faker->name` 属性访问

- **文件**: `database/factories/UserFactory.php:17`
- `$this->faker->name` 应改为 `$this->faker->name()`，与 `email` 的修复保持一致。

---

## 执行顺序

| 顺序 | Phase        | 内容                                                 | 依赖   |
| ---- | ------------ | ---------------------------------------------------- | ------ |
| 1    | 1.1-1.5, 1.7 | 简单 API 路由（控制器方法直接复用，无需修改控制器）  | 无     |
| 2    | 2.1-2.2      | 修改前端 `urls.ts` 和硬编码路径                      | 步骤 1 |
| 3    | 1.8          | 修改需要适配的控制器方法                             | 步骤 1 |
| 4    | 2.3-2.7      | 修复前端 `blessing.extra`、`previewer`、Dashboard 等 | 步骤 3 |
| 5    | 1.6          | Admin Options API（最大的重构）                      | 步骤 3 |
| 6    | 3.1-3.5      | 修复剩余问题                                         | 步骤 4 |

---

## Testing Checklist

部署前验证：

- [ ] OAuth 登录流程端到端可用（SPA → backend login → authorize → callback → token）
- [ ] Token 过期后自动刷新
- [ ] 所有侧边栏链接指向正确的工作页面
- [ ] 未登录用户访问 `/user/*` 和 `/admin/*` 被重定向到 `/auth/login`
- [ ] 非 admin 用户访问 `/admin/*` 显示权限拒绝
- [ ] Skin Library 浏览无需认证
- [ ] Skin 上传支持 OAuth token
- [ ] Player CRUD 操作可用
- [ ] Closet 收藏/取消可用
- [ ] i18n 翻译在 SPA 中正确加载
- [ ] Edge Function 正确代理所有 `/api/*` 和 `/oauth/*` 请求
- [ ] CORS preflight 请求对所有端点成功
- [ ] 401 响应触发 token 刷新而非立即登出
- [ ] 后端 OAuth 授权页面（Twig 模板）在无 webpack 资源的情况下正常渲染
- [ ] Admin Options 页面的 GET/POST API 能正确读写所有配置项
- [ ] Admin Options 的 locale-suffixed 键正确保存
