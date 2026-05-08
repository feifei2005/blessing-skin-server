// EdgeOne Edge Function: API Proxy
// Proxies API, OAuth, static resources, and auth routes to the PHP backend.
// Deploy this as an Edge Function in EdgeOne Pages.
//
// Note: Root-level JSON routes (e.g., /Steve.json) are NOT proxied here.
// Minecraft clients should directly connect to the API backend for player texture data.

const PROXIED_PATHS = [
  '/api/',
  '/oauth/',
  '/textures/',
  '/avatar/',
  '/preview/',
  '/raw/',
  '/csl/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot',
  '/auth/reset',
  '/auth/logout',
  '/auth/captcha',
  '/auth/verify',
  '/auth/bind',
]

function getCorsOrigin(origin, env) {
  const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',')
  if (allowedOrigins.includes(origin)) {
    return origin
  }
  const first = allowedOrigins[0]
  return first && first.length > 0 ? first : origin || '*'
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (!env.API_BASE_URL) {
      return new Response('API_BASE_URL not configured', { status: 503 })
    }

    const apiBase = env.API_BASE_URL

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': getCorsOrigin(
            request.headers.get('Origin'),
            env,
          ),
          'Access-Control-Allow-Methods':
            'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const shouldProxy = PROXIED_PATHS.some((prefix) =>
      url.pathname.startsWith(prefix),
    )

    if (shouldProxy) {
      const targetUrl = `${apiBase}${url.pathname}${url.search}`

      const headers = new Headers(request.headers)
      headers.delete('Cookie')
      headers.delete('Host')

      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body:
          request.method !== 'GET' && request.method !== 'HEAD'
            ? request.body
            : undefined,
        redirect: 'manual',
      })

      // Rewrite redirect Location from backend URL to EdgeOne origin
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('Location')
        if (location) {
          const newHeaders = new Headers(response.headers)
          newHeaders.set('Location', location.replace(apiBase, url.origin))
          return new Response(response.body, {
            status: response.status,
            headers: newHeaders,
          })
        }
      }

      const respHeaders = new Headers(response.headers)
      respHeaders.set(
        'Access-Control-Allow-Origin',
        getCorsOrigin(request.headers.get('Origin'), env),
      )
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: respHeaders,
      })
    }

    // For all other requests, let EdgeOne serve static files
    return env.ASSETS.fetch(request)
  },
}
