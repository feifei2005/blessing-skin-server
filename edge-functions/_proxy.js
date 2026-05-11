import { API_HOST, FRONTEND_HOST } from './_config.js'

const API_BASE = `https://${API_HOST}`
const CORS_ORIGIN = `https://${FRONTEND_HOST}`

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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  const targetUrl = `${API_BASE}${url.pathname}${url.search}`

  const headers = new Headers(request.headers)
  headers.delete('Cookie')
  headers.delete('Host')

  return fetch(targetUrl, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
  }).then((response) => {
    const respHeaders = new Headers(response.headers)
    respHeaders.set('Access-Control-Allow-Origin', CORS_ORIGIN)

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
