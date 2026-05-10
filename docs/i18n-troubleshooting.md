# i18n 前端渲染问题排查记录

## 症状

前端部署到 EdgeOne Pages 后，登录页（`/auth/login`）所有文字显示为原始翻译 key（如 `auth.login`、`auth.register-link`），而非实际中文文本（如 `登录`、`已经有账号了？登录`）。

## 已确认正常的部分

| 检查项                  | 状态        | 详情                                                  |
| ----------------------- | ----------- | ----------------------------------------------------- |
| 后端 i18n API           | ✅ 200 OK   | `GET /api/i18n/zh_CN` 返回完整中文 JSON               |
| 前端网络请求            | ✅ 全部 200 | 11 个请求无一失败                                     |
| JS 控制台               | ✅ 无报错   | `list_console_messages` 返回空                        |
| `config.json`           | ✅ 正确     | `{"apiBase":"https://skinapi.xn--suki-uf1gk54ba.cn"}` |
| `blessing.i18n`（全局） | ✅ 已填充   | `evaluate_script` 确认 `blessing.i18n.auth` 存在      |
| React 路由              | ✅ 正常     | 页面自动跳转 `/auth/login`                            |
| CSS/JS/Chunk            | ✅ 全部加载 | HTTP 200                                              |

## 根因分析

### webpack 代码分割导致 `i18n.ts` 模块被复制

```
主 Bundle (app.*.js)                登录页 Chunk (175.*.js)
┌─────────────────────────┐         ┌─────────────────────────┐
│ i18n.ts 副本 A           │         │ i18n.ts 副本 B           │
│                          │         │                          │
│ let i18nTable = {}       │         │ let i18nTable = {}  ← 空!│
│                          │         │                          │
│ loadI18n() {             │         │ trans() {                │
│   fetch → setI18n(data)  │         │   temp = i18nTable       │
│   ├─ i18nTable = data  ←┼─ OK     │   return key ← 原始key!  │
│   └─ bless.i18n = data   │         │ }                        │
│ }                        │         └─────────────────────────┘
└─────────────────────────┘
```

1. `loadI18n()` 在**主 Bundle** 中执行，将中文数据写入 `blessing.i18n`（全局对象）和副本 A 的 `i18nTable`
2. `trans()` 在**登录页 Chunk** 中被调用，读取副本 B 的 `i18nTable`，该变量从未被 `setI18n()` 更新，始终为 `{}`
3. `trans()` 发现 `i18nTable["auth"]` 为 `undefined`，直接返回原始 key `"auth.login"`

**验证方法：** 在浏览器控制台执行：

```js
window.blessing.i18n.auth.login // → "登录" (全局已填充)
```

但页面仍然显示 `auth.login`，说明 `trans()` 未从全局读取。

## 尝试的修复方案及结果

### 尝试 1：修复 locale 提取

**文件：** `resources/assets/src/contexts/AppConfig.tsx`

**问题：** `navigator.language.split('-')[0]` 将 `zh-CN` 截断为 `zh`，后端只支持 `zh_CN`，返回 400。

**修改：** `split('-')[0]` → `replace(/-/g, '_')`，使 `zh-CN` → `zh_CN`。

**结果：** ✅ 解决了 `400 Unsupported locale`，但 UI 仍不正常。

**Commit：** `c44482e`（第 2 次，`cf33e6e` 的第 1 次只改了第 16 行，遗漏了第 66 行）

---

### 尝试 2：i18n 加载失败时回退到 `en`

**文件：** `resources/assets/src/scripts/i18n.ts` — `loadI18n()`

**问题：** 原始代码对非 2xx 响应静默失败，`i18nTable` 保持 `{}`，所有 `trans()` 返回 raw key。其他语言区用户（ja、fr 等）将无法正常使用。

**修改：**

```typescript
// 原
try {
  const resp = await fetch(`/api/i18n/${locale}`)
  if (resp.ok) setI18n(data)
} catch {}
// ↓
for (const lang of [locale, 'en']) {
  try {
    const resp = await fetch(`/api/i18n/${lang}`)
    if (resp.ok) {
      setI18n(data)
      return
    }
  } catch {}
}
```

**结果：** ✅ 解决了语言区回退问题，但 webpack chunk 隔离问题未解决。

**Commit：** `c44482e`

---

### 尝试 3：让 `trans()` 从全局 `blessing.i18n` 读取

**文件：** `resources/assets/src/scripts/i18n.ts` — `t()` 函数

**修改：**

```typescript
// 原
let temp = i18nTable
// ↓
let temp = (blessing.i18n || i18nTable) as I18nTable
```

**预期：** 优先读取全局 `blessing.i18n`（已被 `loadI18n` 正确填充），回退到模块级 `i18nTable`。

**结果：** ❌ 未生效。可能原因：

- EdgeOne CDN 缓存未刷新，仍返回旧版本 JS
- 或 `trans()` 所在的 chunk 副本中 `blessing` 引用指向了不同的全局上下文

**Commit：** `8384d15`

---

## 各 Commit 总结

```
8384d15  fix: read i18n from blessing.i18n global to avoid webpack chunk isolation
c44482e  fix: add en fallback in loadI18n, fix second split->replace for locale
cf33e6e  fix: use replace(-,_) instead of split(-)[0] for locale, revert i18n alias
f500215  fix: add zh locale alias mapping in i18n endpoint (后来被 cf33e6e 撤销)
57a0a18  feat: add HTTPS, imagick support, change domain to skinapi
973da58  fix: hardcode API base URL in build, default OAuth client ID to 1
c91968a  feat: add Docker deployment config, EdgeOne Git build fix, and deployment docs
913086d  fix: add fullySpecified false for ESM module resolution in webpack
```

## 根本解决方案（未实施）

要彻底解决 webpack chunk 隔离问题，有三种方案：

**方案 A：确保 webpack 不分割 `i18n.ts`**

在 `webpack.config.ts` 中配置 splitChunks 将 i18n 模块排除在异步 chunk 之外，强制打入主 bundle。

```ts
optimization: {
  splitChunks: {
    cacheGroups: {
      i18n: {
        test: /[\\/]scripts[\\/]i18n\.ts$/,
        chunks: 'all',
        name: 'i18n',
        enforce: true,
        minChunks: 1,
      }
    }
  }
}
```

**方案 B：`trans()` 完全基于全局变量，去掉模块级 `i18nTable`**

```typescript
// 删除模块级变量，直接从全局读
export function t(key: string, parameters = {}): string {
  const temp = (blessing.i18n as I18nTable) || {}
  // ... 遍历 temp
}
```

**方案 C：i18n 数据通过 React Context 传递**

将 `loadI18n` 的结果存入 `AppConfigContext`，`trans()` 改为 hook（`useT()`）从 context 取值，避免模块级变量问题。

---

## 调试工具

使用了 `chrome-devtools-mcp` (v0.25.0) 进行无头浏览器调试：

```bash
npm install -g chrome-devtools-mcp
chrome-devtools start --headless
chrome-devtools navigate_page --type url --url "https://skin.xn--suki-uf1gk54ba.cn/"
chrome-devtools take_screenshot --filePath screenshot.png
chrome-devtools list_console_messages
chrome-devtools list_network_requests
chrome-devtools evaluate_script "() => ({ ... })"
chrome-devtools stop
```

通过它确认了网络层和 JS 运行时的实际状态，锁定了 chunk 隔离根因。
