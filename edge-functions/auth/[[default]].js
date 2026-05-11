import { proxy } from '../_proxy.js'

// SPA 前端路由 — 不代理，交给静态资源 / _redirects 处理
const SPA_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot',
  '/auth/reset',
  '/auth/callback',
  '/auth/bind',
  '/auth/verify',
]

function isSpaRoute(pathname) {
  return SPA_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
}

export function onRequest(context) {
  const url = new URL(context.request.url)

  // GET 请求且匹配 SPA 路由 → 返回 SPA index.html
  if (context.request.method === 'GET' && isSpaRoute(url.pathname)) {
    return fetch(new URL('/index.html', url.origin))
  }

  // 其余请求（POST /auth/login, GET /auth/captcha 等）→ 代理到后端
  return proxy(context)
}
