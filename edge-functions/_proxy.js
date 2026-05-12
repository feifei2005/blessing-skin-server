import { API_HOST, FRONTEND_HOST } from './_config.js'

const API_BASE = `https://${API_HOST}`
const CORS_ORIGIN = `https://${FRONTEND_HOST}`

// 需要保留 Cookie 的路径（session 相关）
const COOKIE_PATHS = ['/auth/captcha', '/auth/register']

function needsCookie(pathname) {
  return COOKIE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )
}

export function proxy(context) {
  const { request } = context
  const url = new URL(request.url)

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': CORS_ORIGIN,
        'Access-Control-Allow-Methods':
          'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, X-CSRF-TOKEN',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  const targetUrl = `${API_BASE}${url.pathname}${url.search}`

  const headers = new Headers(request.headers)
  // 仅在不需要 Cookie 的路径上删除 Cookie
  if (!needsCookie(url.pathname)) {
    headers.delete('Cookie')
  }
  headers.delete('Host')

  return fetch(targetUrl, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
  }).then((response) => {
    const respHeaders = new Headers(response.headers)
    respHeaders.set('Access-Control-Allow-Origin', CORS_ORIGIN)
    respHeaders.set('Access-Control-Allow-Credentials', 'true')

    // fetch() 会自动解压 gzip/br，但保留原始 Content-Encoding 头
    // 必须删除，否则浏览器会尝试二次解压导致 ERR_CONTENT_DECODING_FAILED
    respHeaders.delete('Content-Encoding')
    respHeaders.delete('Content-Length')

    // 重写 redirect Location，避免泄露后端域名
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('Location')
      if (location) {
        respHeaders.set('Location', location.replace(API_BASE, url.origin))
      }
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
    })
  })
}
