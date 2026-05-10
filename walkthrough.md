# Code Review: 未提交变更

> Review 了 25 个已修改文件 + 3 个新文件，对照 `implementation_plan.md` 逐项检查。

---

## 总览

| 类别            | 文件数 |      状态       |
| :-------------- | :----: | :-------------: |
| 源码修改        |   3    | ⚠️ 2 个有小问题 |
| 新基础设施      |   2    |  ⚠️ 1 个有 bug  |
| URL 前缀修复    |   12   |     ✅ 正确     |
| Router 包裹修复 |   5    |  ⚠️ 1 个有 bug  |
| 整文件重写      |   2    |     ✅ 正确     |
| 非测试变更      |   3    | ⚠️ 建议分离提交 |

---

## 🔴 需修复的问题

### Issue 1: `Reset.test.tsx` — `urls.auth.reset(0)` 应为 `reset(1)`

```diff
// Reset.tsx L39: const uid = location.pathname.split('/').pop()
// MemoryRouter route = '/auth/reset/1' → uid = '1' → Number('1') = 1
// 但测试断言写的是 reset(0) ❌

-      urls.auth.reset(0),
+      urls.auth.reset(1),
```

`Reset.tsx` 通过 `location.pathname.split('/').pop()` 提取 uid。路由设为 `/auth/reset/1` 时，pop() 返回 `'1'`，`Number('1')` = 1。但测试中两处都写成了 `urls.auth.reset(0)`。

**位置**: [Reset.test.tsx L40, L63](file:///c:/Users/Yangg/projects/blessing-skin-server/resources/assets/tests/views/auth/Reset.test.tsx#L40)

---

### Issue 2: `AuthContext.ts` mock — 缺少 `React` import

```ts
// 当前代码
export const AuthProvider = ({ children }: { children: React.ReactNode }) =>
  children
// ❌ React 未 import，TypeScript 编译会报错
```

**修复**:

```diff
+import React from 'react'
+
 export const useAuth = jest.fn().mockReturnValue({
```

或者改为不使用 JSX/类型:

```ts
export const AuthProvider = ({ children }: any) => children
```

**位置**: [AuthContext.ts L10](file:///c:/Users/Yangg/projects/blessing-skin-server/resources/assets/tests/__mocks__/@/auth/AuthContext.ts#L10)

---

### Issue 3: `__mocks__/@/auth/AuthContext.ts` 路径可能不会被 Jest 自动识别

Jest 的 `__mocks__` 自动 mock 机制是基于**模块解析路径**的，不支持 `moduleNameMapper` 别名。`@/auth/AuthContext` 通过 `moduleNameMapper` 映射到 `src/auth/AuthContext`，但 Jest 不会自动在 `tests/__mocks__/@/auth/` 中查找 mock。

**建议**: 在实际使用 `useAuth` 的测试文件中显式添加：

```ts
jest.mock('@/auth/AuthContext')
```

这样 Jest 会从 `__mocks__` 目录中找到手动 mock。或者直接在每个需要的测试文件中内联 mock（如 `Login.test.tsx` 和 `NotificationsList.test.tsx` 已经做的那样）。

> [!TIP]
> 验证方法: 跑一个使用 `useAuth` 但**没有**显式 `jest.mock` 的测试文件（如 `PluginsManagement.test.tsx`），看 `useAuth` 是否返回 mock 值。如果不是，就需要在这些文件中手动添加 `jest.mock('@/auth/AuthContext')`。

---

## 🟡 建议优化

### Issue 4: `Show.test.tsx` — 缩进不一致

`renderWithRouter` 替换后，部分 `{route, path}` 参数的缩进与周围代码不一致：

```tsx
// 当前（不一致）
const { getByText, queryByText } = renderWithRouter(<Show />, {
  route: '/skinlib/show/1',
  path: '/skinlib/show/:id',
}) // ← 顶格

// 应统一为
const { getByText, queryByText } = renderWithRouter(<Show />, {
  route: '/skinlib/show/1',
  path: '/skinlib/show/:id',
})
```

这不影响功能但影响可读性。约有 20+ 处此类缩进问题。

---

### Issue 5: `net.ts` 改了但 `net.test.ts` 未修改

`escapeHtml` 从 catch 块中移除后，`net.test.ts` 的 "process backend errors" 测试（如果存在 500 异常带 trace 的 case）断言仍会期望旧的转义行为。

**当前状态**: `net.test.ts` 未出现在 diff 中 → 这个测试 case 的断言未同步更新。

---

### Issue 6: `composer.json` + `composer.lock` + `AuthServiceProvider.php` 与测试修复无关

- `composer.json`: 添加了 `audit.ignore` 配置
- `composer.lock`: 大量包版本变化 (4386 行变更)
- `AuthServiceProvider.php`: 注释掉 `requireCodeChallengeForPublicClients()`

这些是独立的变更，建议与测试修复**分开提交**，保持 commit 职责清晰：

```bash
# 提交 1: Passport/composer 升级
git add composer.json composer.lock app/Providers/AuthServiceProvider.php
git commit -m "chore: upgrade Passport to 11.x, add audit ignore"

# 提交 2: 测试基础设施 + 修复
git add resources/assets/
git commit -m "test: fix 129 frontend tests for SPA migration"
```

---

## ✅ 正确的变更

以下文件 review 通过，修改正确：

| 文件                         | 修改内容                                                       |
| :--------------------------- | :------------------------------------------------------------- |
| `AppConfig.tsx`              | `extra` 默认值 fallback 到 `window.blessing.extra` ✅          |
| `net.ts`                     | 移除 `escapeHtml` 双重转义 ✅                                  |
| `testHelpers.tsx`            | `renderWithRouter` 实现正确 ✅                                 |
| `Login.test.tsx`             | 整文件重写匹配 OAuth 登录 ✅                                   |
| `NotificationsList.test.tsx` | 重写匹配 API 数据源 ✅                                         |
| `Forgot.test.tsx`            | 添加 `renderWithRouter` ✅                                     |
| `Registration.test.tsx`      | 添加 `renderWithRouter` ✅                                     |
| `DarkModeButton.test.tsx`    | URL 前缀更新 ✅                                                |
| `ClosetCommand.test.ts`      | URL 前缀更新 ✅                                                |
| `RmCommand.test.ts`          | URL 前缀更新 ✅                                                |
| `AptCommand.test.ts`         | URL 前缀更新 ✅                                                |
| `DnfCommand.test.ts`         | URL 前缀更新 ✅                                                |
| `PacmanCommand.test.ts`      | URL 前缀更新 ✅                                                |
| `PluginsManagement.test.tsx` | URL 前缀更新 ✅                                                |
| `PluginsMarket.test.tsx`     | URL 前缀更新 ✅                                                |
| `ReportsManagement.test.tsx` | URL 前缀更新 (`/admin/reports/list` → `/api/admin/reports`) ✅ |
| `Translations.test.tsx`      | URL 前缀更新 ✅                                                |
| `SkinLibrary.test.tsx`       | URL 前缀更新 ✅                                                |
| `EmailVerification.test.tsx` | URL 前缀更新 ✅                                                |
| `Players.test.tsx`           | URL 前缀更新 (`/skinlib/info/` → `/api/skinlib/info/`) ✅      |
| `i18n.test.ts`               | 改用 `setI18n()` ✅                                            |

---

## 额外注意：`AppConfig.tsx` 的 `useBlessingExtra` 增加了 `windowExtra` fallback

```tsx
const windowExtra = (window as any).blessing?.extra?.[key]
const [value, setValue] = useState<T>(
  (extra[key] as T) ?? (windowExtra as T) ?? (defaultValue as T),
)
```

这比计划中多做了一步（计划只改 `defaultConfig.extra`），实际上是双保险：

1. `defaultConfig.extra` 已经 fallback 到 `window.blessing.extra`
2. `useBlessingExtra` 内部又显式查一次 `window.blessing.extra[key]`

功能上不会出错，但有轻微的冗余。不影响正确性，可以保留。

---

## 修复行动清单

```
[!] 1. Reset.test.tsx: urls.auth.reset(0) → urls.auth.reset(1)  (2 处)
[!] 2. AuthContext.ts mock: 添加 import React 或改用 any 类型
[ ] 3. 验证 __mocks__ 路径是否被 Jest 识别，必要时添加显式 jest.mock
[ ] 4. 补充 net.test.ts 的断言更新
[ ] 5. Show.test.tsx 缩进规范化 (可选)
[ ] 6. 分离 composer/Passport 变更为单独 commit
```
