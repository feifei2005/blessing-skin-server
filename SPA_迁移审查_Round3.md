# Code Review: `992f83dd` — reCAPTCHA → Turnstile + Round 3 修复

**提交者**: feifei2005 | **日期**: 2026-05-10 01:40 | **变更**: 23 files, +427 / −1229

---

## 概述

本次提交完成两件事：

1. **将 reCAPTCHA 替换为 Cloudflare Turnstile** — 前后端全链路迁移
2. **修复 Round 3 审查的 9 个问题** (N1–N9)

整体质量**很好**，Round 3 审查文档中提出的问题都得到了修复。以下是逐模块的详细 review。

---

## ✅ 做得好的部分

| 方面 | 评价 |
|------|------|
| **Turnstile 迁移完整性** | 前端组件、后端验证、配置项、i18n、Admin UI 全部同步更新，无遗漏 |
| **依赖清理** | 移除 `reaptcha`，新增 `@marsidev/react-turnstile`，`yarn.lock` 同步 |
| **Captcha 后端双路径** | `Captcha.php` 同时支持 Turnstile（secret key 存在时）和图片验证码（fallback），很好 |
| **API 无 session 兼容** | N1 captcha cache、N3 `Auth::login` guard、N6 session flush guard 都正确处理了 |
| **Edge Function CORS** | 重定向分支补上了 `Access-Control-Allow-Origin`，修复完整 |
| **i18n 国际化** | Callback 和 Guards 的硬编码字符串已全部替换为 `t()` 调用 |
| **Dockerfile Node 版本** | 已固定为 `node:20-alpine` |
| **旧 Review 文件清理** | 删除了 1098 行的 `SPA_MIGRATION_REVIEW.md`，新增精简的 Round 3 review |

---

## 🟡 需注意的问题

### 1. `Captcha.php` — Turnstile 验证缺少 `remoteip` 参数

**位置**: [Captcha.php:18-23](file:///c:/Users/Yangg/projects/blessing-skin-server/app/Rules/Captcha.php#L18-L23)

```php
return Http::asForm()
    ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
        'secret' => $secretkey,
        'response' => $value,
    ])
    ->json()['success'];
```

Cloudflare Turnstile 的 `siteverify` API 支持可选的 `remoteip` 参数，传入客户端 IP 可以增强安全性（防止 token 被跨 IP 重放）。当前实现可以工作，但建议补上：

```php
->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
    'secret' => $secretkey,
    'response' => $value,
    'remoteip' => $whip->getValidIpAddress(), // 可选但推荐
])
```

**严重程度**: 🟢 Low（安全加固建议，非必须）

---

### 2. `Captcha.php` — 未处理 Turnstile API 网络异常

**位置**: [Captcha.php:18-23](file:///c:/Users/Yangg/projects/blessing-skin-server/app/Rules/Captcha.php#L18-L23)

如果 Cloudflare 的 `siteverify` 端点不可达或返回非 JSON 响应，`->json()['success']` 会抛异常（`undefined index` 或 HTTP 异常）。原来的 reCAPTCHA 也有同样的问题，但既然在重写，建议加个防御：

```php
$result = Http::asForm()
    ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [...])
    ->json();
return $result['success'] ?? false;
```

**严重程度**: 🟡 Medium（生产环境 Cloudflare 偶尔不可用时会导致 500）

---

### 3. `Captcha.tsx` — `execute()` 的 race condition

**位置**: [Captcha.tsx:21-27](file:///c:/Users/Yangg/projects/blessing-skin-server/resources/assets/src/components/Captcha.tsx#L21-L27)

```tsx
execute: async () => {
  if (turnstileRef.current) {
    return turnstileRef.current.getResponsePromise()
  }
  return value
},
```

当使用 Turnstile 时，如果 `turnstileRef.current` 存在但用户尚未完成人机验证，`getResponsePromise()` 会 resolve 一个 pending 的 Promise。这是正确的行为。

但当 **没有** Turnstile（图片验证码路径）且 `value` 为空字符串时，`execute()` 会立即 return `''`，导致空 captcha 提交。调用方需要自行检查。这和旧代码行为一致，不是退步，但值得注意。

**严重程度**: 🟢 Low（行为与旧版一致）

---

### 4. `Captcha.tsx` — 未使用的 import 可以合并

**位置**: [Captcha.tsx:5-6](file:///c:/Users/Yangg/projects/blessing-skin-server/resources/assets/src/components/Captcha.tsx#L5-L6)

```tsx
import { useBlessingExtra } from '@/contexts/AppConfig'
import { useAppConfig } from '@/contexts/AppConfig'
```

两个 import 来自同一模块，应该合并为一行：

```tsx
import { useBlessingExtra, useAppConfig } from '@/contexts/AppConfig'
```

**严重程度**: 🟢 Nit

---

### 5. `AuthController::handleLogin` — `Auth::login` 无 session guard

**位置**: [AuthController.php:99](file:///c:/Users/Yangg/projects/blessing-skin-server/app/Http/Controllers/AuthController.php#L99)

```php
Auth::login($user, $request->input('keep'));
```

`handleRegister` 中已经加了 `$request->hasSession()` 守卫（L233），但 `handleLogin` 没有。虽然 login 路由通常走 web 中间件有 session，但如果通过 API 路由调用（`/api/auth/login`），`Auth::login()` 会尝试写 session 但静默失败。

建议统一风格，也加上守卫。

**严重程度**: 🟢 Low（API 场景下不会出错，只是不一致）

---

### 6. `AuthController::logout` — 缺少 session guard

**位置**: [AuthController.php:132](file:///c:/Users/Yangg/projects/blessing-skin-server/app/Http/Controllers/AuthController.php#L132)

```php
Auth::logout();
```

同理，`Auth::logout()` 在无 session 环境下操作 session 会静默失败。Bearer token 路径 (L128-130) 正确地 revoke 了 token，但后面仍然调了 `Auth::logout()`。

**严重程度**: 🟢 Low

---

### 7. `Options.tsx` — Admin 面板 Turnstile 区域 label 对不上

**位置**: [Options.tsx:291-297](file:///c:/Users/Yangg/projects/blessing-skin-server/resources/assets/src/views/admin/Options.tsx#L291-L297)

```tsx
<label>{t('options.turnstile.turnstile_sitekey.title')}</label>
<input
  className="form-control"
  value={data.turnstile_sitekey}
  onChange={(e) => update('turnstile_sitekey', e.target.value)}
/>
```

上面第 282 行区域还有一段代码渲染了 meta_description 和 meta_extras，与 Turnstile 卡片混在一起。从 diff 来看，这是从旧的 "SEO & reCAPTCHA" 合并卡片继承过来的布局——meta 标签放在 Turnstile 卡片内。

> 确认：这个 layout 是否是故意的？如果 Turnstile 卡片标题改成了 "Cloudflare Turnstile"，那 meta_description/meta_extras 字段出现在这个卡片里就不太合理了。

**严重程度**: 🟡 Medium（UI 逻辑混乱，但不影响功能）

---

### 8. `Guards.tsx` — Admin 和 SuperAdmin 使用了相同的 i18n key

**位置**: [Guards.tsx:53-60](file:///c:/Users/Yangg/projects/blessing-skin-server/resources/assets/src/components/Guards.tsx#L53-L60)

```tsx
// Admin check
{t('auth.check.admin')}
// ...
// Super Admin check
{t('auth.check.admin')}  // ← 相同的 key
```

两处都用了 `auth.check.admin`，但语义不同（一个是 Admin 权限不足，一个是 Super Admin 权限不足）。旧代码至少用了不同的文案。建议分开两个 key，或者传参区分。

**严重程度**: 🟢 Low（用户看到的提示信息不够精确）

---

### 9. `api-proxy.js` — 重定向分支只注入了 CORS 头，缺少 `Access-Control-Allow-Credentials`

**位置**: [api-proxy.js:89-92](file:///c:/Users/Yangg/projects/blessing-skin-server/edge-functions/api-proxy.js#L89-L92)

正常响应路径（L100-108）没有设置 `Allow-Credentials`，重定向路径也没有。如果未来需要带 credentials 的跨域请求，需要统一添加。当前 SPA 使用 Bearer token 不需要 credentials，所以不影响。

**严重程度**: 🟢 Nit

---

### 10. `@types/react` 从 16 升到 17

**位置**: `yarn.lock` 变更

```diff
-"@types/react@^16", "@types/react@^16.9.35":
-  version "16.14.55"
+"@types/react@^17.0.0":
+  version "17.0.91"
```

`@marsidev/react-turnstile` 拉入了 `@types/react@^17.0.0` 和 `@types/react-dom@^17.0.0` 的依赖。如果项目实际使用的 React 运行时版本是 16.x，可能会出现类型不兼容。需确认 `package.json` 中的 React 版本。

**严重程度**: 🟡 Medium（如果 React 运行时是 16.x 可能导致类型冲突）

---

## 总结

| 级别 | 数量 | 说明 |
|------|:---:|------|
| 🔴 Critical | 0 | — |
| 🟡 Medium | 3 | #2 Turnstile API 异常处理、#7 Admin UI 布局、#10 React types 版本 |
| 🟢 Low/Nit | 7 | #1 remoteip、#3 race condition、#4 import 合并、#5/#6 session guard、#8 i18n key、#9 CORS |

> [!TIP]
> 整体完成度很高，Round 3 的所有问题都已修复。建议优先处理 **#2**（Turnstile API 异常防御）和 **#10**（React types 版本确认），其余可在后续迭代中收尾。
